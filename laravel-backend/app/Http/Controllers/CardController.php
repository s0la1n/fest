<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\UserCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CardController extends Controller
{
    /**
     * Список только своих карточек пользователя
     */
    public function index(Request $request)
    {
        $userCards = $request->user()
            ->userCards()
            ->with('card')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (UserCard $userCard) {
                $card = $userCard->card;
                return [
                    'id' => $userCard->id,
                    'card_id' => $card->id,
                    'name' => $card->name,
                    'description' => $card->description,
                    'image' => $card->image_url,
                    'rarity' => $card->rarity,
                    'type_bonus' => $card->type_bonus,
                    'bonus_value' => $card->bonus_value,
                    'coupon_code' => $card->coupon_code,
                    'status' => $userCard->status,
                    'qr_data' => $userCard->status === 'acquired' && $card->type_bonus !== 'virtual_currency' 
                        ? $this->generateQrData($userCard, $card) 
                        : null,
                    'acquired_at' => $userCard->created_at?->toIso8601String(),
                ];
            });

        return response()->json(['cards' => $userCards]);
    }

    /**
     * Активация карточки по секретному коду
     */
    public function getCard(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:255',
        ]);

        $card = Card::where('qr_code_get', $request->code)
            ->orWhere('qr_code_get_hash', hash('sha256', $request->code))
            ->first();

        if (!$card) {
            return response()->json(['error' => 'Код не найден или неверный'], 404);
        }

        if ($card->status !== 'available' && $card->status !== 'active') {
            return response()->json(['error' => 'Карточка сейчас недоступна'], 400);
        }

        if ($card->used_quantity >= $card->stock_quantity) {
            return response()->json(['error' => 'Карточки закончились'], 400);
        }

        $existingUserCard = UserCard::where('user_id', $request->user()->id)
            ->where('card_id', $card->id)
            ->first();

        if ($existingUserCard) {
            return response()->json(['error' => 'Вы уже активировали эту карточку'], 400);
        }

        DB::transaction(function () use ($card, $request) {
            UserCard::create([
                'user_id' => $request->user()->id,
                'card_id' => $card->id,
                'status' => 'acquired',
            ]);
            $card->increment('used_quantity');
        });

        return response()->json([
            'success' => true,
            'message' => 'Карточка успешно получена!',
            'card' => [
                'name' => $card->name,
                'image' => $card->image_url,
                'rarity' => $card->rarity,
                'type_bonus' => $card->type_bonus,
            ],
        ]);
    }

    /**
     * Использование бонуса по карточке
     */
    public function useBonus(Request $request, UserCard $userCard)
    {
        if ($userCard->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Доступ запрещён'], 403);
        }

        if ($userCard->status === 'bonus_used') {
            return response()->json(['error' => 'Бонус по этой карточке уже использован'], 400);
        }

        if (!in_array($userCard->status, ['acquired', 'active'])) {
            return response()->json(['error' => 'Невозможно использовать бонус'], 400);
        }

        $card = $userCard->card;
        $user = $request->user();
        $bonusData = [];

        switch ($card->type_bonus) {
            case 'virtual_currency':
                $amount = (int) ($card->bonus_value ?? 100);
                DB::transaction(function () use ($user, $amount, $userCard) {
                    $user->increment('balance', $amount);
                    $user->balanceHistories()->create([
                        'amount' => $amount,
                        'type' => 'card_bonus',
                        'related_user_card_id' => $userCard->id,
                    ]);
                    $userCard->update(['status' => 'bonus_used']);
                });
                $bonusData = [
                    'type' => 'virtual_currency',
                    'amount' => $amount, 
                    'new_balance' => (int) $user->fresh()->balance
                ];
                break;

            case 'coupon':
                // Генерируем уникальный промокод для пользователя
                $uniqueCode = $this->generateUniqueCouponCode($card->id, $user->id);
                
                DB::transaction(function () use ($userCard, $card, $uniqueCode) {
                    // Сохраняем промокод в карточке пользователя или в отдельной таблице
                    $userCard->update([
                        'status' => 'bonus_used',
                        'coupon_code_used' => $uniqueCode, // Добавим поле в миграцию
                    ]);
                });
                
                $bonusData = [
                    'type' => 'coupon',
                    'coupon_code' => $uniqueCode,
                    'message' => "Ваш промокод: {$uniqueCode}"
                ];
                break;

            case 'discount':
                $discountPercent = (int) ($card->bonus_value ?? 10);
                DB::transaction(function () use ($userCard, $discountPercent) {
                    $userCard->update([
                        'status' => 'bonus_used',
                        'bonus_used_data' => json_encode(['discount_percent' => $discountPercent]),
                    ]);
                });
                $bonusData = [
                    'type' => 'discount',
                    'discount_percent' => $discountPercent,
                    'message' => "Скидка {$discountPercent}%"
                ];
                break;

            case 'physical_gift':
                DB::transaction(function () use ($userCard) {
                    $userCard->update([
                        'status' => 'bonus_used',
                        'bonus_used_data' => json_encode(['gift_type' => 'physical', 'claimed' => false]),
                    ]);
                });
                $bonusData = [
                    'type' => 'physical_gift',
                    'message' => 'Подарок можно получить на стойке информации'
                ];
                break;

            case 'digital_gift':
                // Генерируем ссылку на цифровой подарок
                $giftLink = $this->generateDigitalGiftLink($card->id, $user->id);
                DB::transaction(function () use ($userCard, $giftLink) {
                    $userCard->update([
                        'status' => 'bonus_used',
                        'bonus_used_data' => json_encode(['gift_link' => $giftLink]),
                    ]);
                });
                $bonusData = [
                    'type' => 'digital_gift',
                    'gift_link' => $giftLink,
                    'message' => 'Цифровой подарок доступен по ссылке'
                ];
                break;

            case 'experience':
                DB::transaction(function () use ($userCard) {
                    $userCard->update([
                        'status' => 'bonus_used',
                        'bonus_used_data' => json_encode(['experience_type' => 'backstage', 'claimed' => false]),
                    ]);
                });
                $bonusData = [
                    'type' => 'experience',
                    'message' => 'Впечатление нужно активировать на стойке информации'
                ];
                break;

            default:
                $userCard->update(['status' => 'bonus_used']);
                $bonusData = ['message' => 'Бонус активирован'];
                break;
        }

        return response()->json([
            'success' => true,
            'message' => 'Бонус успешно использован',
            'bonus' => $bonusData,
        ]);
    }

    /**
     * Генерация уникального промокода для пользователя
     */
    private function generateUniqueCouponCode(int $cardId, int $userId): string
    {
        $prefix = 'CARD';
        $unique = strtoupper(Str::random(8));
        $code = "{$prefix}-{$cardId}-{$userId}-{$unique}";
        return $code;
    }

    /**
     * Генерация ссылки на цифровой подарок
     */
    private function generateDigitalGiftLink(int $cardId, int $userId): string
    {
        $token = hash('sha256', $cardId . $userId . Str::random(32));
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
        return "{$frontendUrl}/gift/{$token}";
    }

    /**
     * Генерация QR-данных для карточки
     */
    private function generateQrData(UserCard $userCard, Card $card): string
    {
        $data = [
            'card_name' => $card->name,
            'card_id' => $card->id,
            'user_card_id' => $userCard->id,
            'type_bonus' => $card->type_bonus,
            'bonus_value' => $card->bonus_value,
            'coupon_code' => $card->coupon_code,
            'used_at' => now()->toIso8601String(),
        ];
        
        return json_encode($data);
    }

    /**
     * Получить сообщение для бонуса
     */
    private function getBonusMessage(Card $card): string
    {
        return match ($card->type_bonus) {
            'coupon' => "Промокод: {$card->coupon_code}",
            'discount' => "Скидка {$card->bonus_value}%",
            'physical_gift' => 'Физический подарок',
            'digital_gift' => 'Цифровой подарок',
            'experience' => 'Впечатления',
            default => 'Бонус активирован',
        };
    }

    /**
     * Получить все карточки (для админа)
     */
    public function getAllCards()
    {
        $cards = Card::orderBy('created_at', 'desc')->get()
            ->map(function ($card) {
                return [
                    'id' => $card->id,
                    'name' => $card->name,
                    'description' => $card->description,
                    'image' => $card->image_url,
                    'rarity' => $card->rarity,
                    'type_bonus' => $card->type_bonus,
                    'bonus_value' => $card->bonus_value,
                    'coupon_code' => $card->coupon_code,
                    'stock_quantity' => $card->stock_quantity,
                    'used_quantity' => $card->used_quantity,
                    'qr_code_get' => $card->qr_code_get,
                    'status' => $card->status,
                    'created_at' => $card->created_at?->toIso8601String(),
                ];
            });
        
        return response()->json(['cards' => $cards]);
    }

    /**
     * Создать новую карточку (для админа)
     */
    public function createCard(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|max:5120',
            'rarity' => 'required|in:common,rare,epic,legendary,secret',
            'type_bonus' => 'required|in:discount,coupon,virtual_currency,physical_gift,digital_gift,experience',
            'bonus_value' => 'nullable|integer|min:1',
            'coupon_code' => 'nullable|string|max:64',
            'stock_quantity' => 'required|integer|min:1',
            'status' => 'required|in:available,active,inactive,expired,out_of_stock',
        ]);

        // Загрузка изображения
        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . Str::random(40) . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('cards', $filename, 'public');
        }

        if (!$imagePath) {
            return response()->json(['error' => 'Изображение обязательно'], 422);
        }

        // Генерируем код для активации карточки
        $qrCode = strtoupper(Str::random(12));
        
        // Для типа coupon НЕ генерируем промокод заранее
        // Он будет генерироваться при активации карточки пользователем
        $couponCode = null;
        if ($validated['type_bonus'] === 'coupon') {
            $couponCode = null; // Не сохраняем промокод в карточку
        } elseif ($validated['type_bonus'] === 'coupon' && !empty($validated['coupon_code'])) {
            $couponCode = $validated['coupon_code'];
        }

        // Для виртуальной валюты устанавливаем значение по умолчанию
        $bonusValue = null;
        if ($validated['type_bonus'] === 'virtual_currency') {
            $bonusValue = $validated['bonus_value'] ?? 100;
        }
        
        // Для скидки устанавливаем значение
        if ($validated['type_bonus'] === 'discount') {
            $bonusValue = $validated['bonus_value'] ?? 10;
        }

        $card = Card::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'image' => $imagePath,
            'rarity' => $validated['rarity'],
            'stock_quantity' => $validated['stock_quantity'],
            'used_quantity' => 0,
            'qr_code_get' => $qrCode,
            'qr_code_get_hash' => hash('sha256', $qrCode),
            'type_bonus' => $validated['type_bonus'],
            'bonus_value' => $bonusValue,
            'coupon_code' => $couponCode,
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'card' => [
                'id' => $card->id,
                'name' => $card->name,
                'image' => $card->image_url,
                'qr_code_get' => $card->qr_code_get,
            ],
            'message' => 'Карточка создана. Код активации: ' . $qrCode
        ], 201);
    }

    /**
     * Удалить карточку (для админа)
     */
    public function deleteCard(Card $card)
    {
        if ($card->used_quantity > 0) {
            return response()->json([
                'error' => 'Нельзя удалить карточку, которая уже была использована'
            ], 400);
        }
        
        // Удаляем изображение
        if ($card->image && Storage::disk('public')->exists($card->image)) {
            Storage::disk('public')->delete($card->image);
        }
        
        $card->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Карточка удалена'
        ]);
    }
}