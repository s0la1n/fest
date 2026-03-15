<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\UserCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CardController extends Controller
{
    /**
     * Список только своих карточек пользователя (не все карточки в системе).
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
                    'image' => $card->image,
                    'rarity' => $card->rarity,
                    'type_bonus' => $card->type_bonus,
                    'bonus_value' => $card->bonus_value,
                    'coupon_code' => $card->coupon_code,
                    'status' => $userCard->status,
                    'acquired_at' => $userCard->created_at?->toIso8601String(),
                ];
            });

        return response()->json(['cards' => $userCards]);
    }

    /**
     * Активация карточки по секретному коду (QR или введённому вручную).
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
                'image' => $card->image,
                'rarity' => $card->rarity,
                'type_bonus' => $card->type_bonus,
            ],
        ]);
    }

    /**
     * Использование бонуса по карточке (купон, скидка, валюта и т.д.).
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
                $amount = (int) ($card->bonus_value ?? self::virtualCurrencyByRarity($card->rarity));
                if ($amount <= 0) {
                    $amount = self::virtualCurrencyByRarity($card->rarity);
                }
                DB::transaction(function () use ($user, $amount, $userCard) {
                    $user->increment('balance', $amount);
                    $user->balanceHistories()->create([
                        'amount' => $amount,
                        'type' => 'card_bonus',
                        'related_user_card_id' => $userCard->id,
                    ]);
                    $userCard->update(['status' => 'bonus_used']);
                });
                $bonusData = ['amount' => $amount, 'new_balance' => (int) $user->fresh()->balance];
                break;

            case 'coupon':
                $code = $card->coupon_code ?? strtoupper(substr(md5($userCard->id . $card->id), 0, 8));
                $userCard->update(['status' => 'bonus_used']);
                $bonusData = ['coupon_code' => $code, 'message' => 'Используйте промокод в магазине партнёра'];
                break;

            case 'discount':
                $percent = (int) ($card->bonus_value ?? 10);
                $userCard->update(['status' => 'bonus_used']);
                $bonusData = ['discount_percent' => $percent, 'message' => "Скидка {$percent}% у партнёра фестиваля"];
                break;

            case 'physical_gift':
            case 'digital_gift':
            case 'experience':
                $userCard->update(['status' => 'bonus_used']);
                $bonusData = ['message' => 'Предъявите карточку на стойке организаторов для получения бонуса'];
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

    private static function virtualCurrencyByRarity(string $rarity): int
    {
        return match ($rarity) {
            'common' => 100,
            'rare' => 300,
            'epic' => 500,
            'legendary' => 700,
            'secret' => 1000,
            default => 100,
        };
    }
}
