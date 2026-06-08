<?php

namespace App\Http\Controllers;

use App\Models\Merch;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ShopController extends Controller
{
    /**
     * Список товаров магазина (для обычных пользователей).
     */
    public function index(): JsonResponse
    {
        $products = Merch::orderBy('name')->get([
            'id', 'name', 'slug', 'description', 'price', 'stock_quantity', 'main_image'
        ])->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'price' => (float) $product->price,
                'stock_quantity' => $product->stock_quantity,
                'main_image' => $product->main_image_url,
            ];
        });
        
        return response()->json($products);
    }

    /**
     * Получить все товары для админа.
     */
    public function getAllMerch(): JsonResponse
    {
        $merch = Merch::orderBy('created_at', 'desc')->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'slug' => $item->slug,
                    'description' => $item->description,
                    'price' => (float) $item->price,
                    'stock_quantity' => $item->stock_quantity,
                    'sold_quantity' => $item->sold_quantity,
                    'main_image' => $item->main_image,
                    'main_image_url' => $item->main_image_url,
                    'created_at' => $item->created_at?->toIso8601String(),
                ];
            });
        
        return response()->json($merch);
    }

    /**
     * Создать новый товар (для админа).
     */
    public function createMerch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'image' => 'required|image|max:5120', // 5MB
        ]);

        // Генерируем slug из названия
        $slug = Str::slug($validated['name']);
        
        // Проверяем уникальность slug
        $originalSlug = $slug;
        $counter = 1;
        while (Merch::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        // Загрузка изображения
        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . Str::random(40) . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('merch', $filename, 'public');
        }

        if (!$imagePath) {
            return response()->json(['error' => 'Изображение обязательно'], 422);
        }

        $merch = Merch::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'stock_quantity' => $validated['stock_quantity'],
            'sold_quantity' => 0,
            'main_image' => $imagePath,
        ]);

        return response()->json([
            'success' => true,
            'merch' => [
                'id' => $merch->id,
                'name' => $merch->name,
                'slug' => $merch->slug,
                'description' => $merch->description,
                'price' => (float) $merch->price,
                'stock_quantity' => $merch->stock_quantity,
                'sold_quantity' => $merch->sold_quantity,
                'main_image_url' => $merch->main_image_url,
            ],
            'message' => 'Товар добавлен'
        ], 201);
    }

    /**
     * Обновить товар (для админа).
     */
    public function updateMerch(Request $request, int $id): JsonResponse
    {
        $merch = Merch::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:5000',
            'price' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
            'image' => 'nullable|image|max:5120',
        ]);

        $data = [];
        
        if (isset($validated['name'])) {
            $data['name'] = $validated['name'];
            // Обновляем slug если изменилось название
            $newSlug = Str::slug($validated['name']);
            $originalSlug = $newSlug;
            $counter = 1;
            while (Merch::where('slug', $newSlug)->where('id', '!=', $merch->id)->exists()) {
                $newSlug = $originalSlug . '-' . $counter;
                $counter++;
            }
            $data['slug'] = $newSlug;
        }
        
        if (isset($validated['description'])) {
            $data['description'] = $validated['description'];
        }
        
        if (isset($validated['price'])) {
            $data['price'] = $validated['price'];
        }
        
        if (isset($validated['stock_quantity'])) {
            $data['stock_quantity'] = $validated['stock_quantity'];
        }

        // Обновляем фото если загружено новое
        if ($request->hasFile('image')) {
            // Удаляем старое фото
            if ($merch->main_image && Storage::disk('public')->exists($merch->main_image)) {
                Storage::disk('public')->delete($merch->main_image);
            }
            
            $file = $request->file('image');
            $filename = time() . '_' . Str::random(40) . '.' . $file->getClientOriginalExtension();
            $data['main_image'] = $file->storeAs('merch', $filename, 'public');
        }

        $merch->update($data);

        return response()->json([
            'success' => true,
            'merch' => [
                'id' => $merch->id,
                'name' => $merch->name,
                'slug' => $merch->slug,
                'description' => $merch->description,
                'price' => (float) $merch->price,
                'stock_quantity' => $merch->stock_quantity,
                'sold_quantity' => $merch->sold_quantity,
                'main_image_url' => $merch->main_image_url,
            ],
            'message' => 'Товар обновлен'
        ]);
    }

    /**
     * Удалить товар (для админа).
     */
    public function deleteMerch(int $id): JsonResponse
    {
        $merch = Merch::findOrFail($id);
        
        // Проверяем, есть ли заказы с этим товаром
        if ($merch->orders()->exists()) {
            return response()->json([
                'error' => 'Нельзя удалить товар, по которому есть заказы'
            ], 400);
        }
        
        // Удаляем фото
        if ($merch->main_image && Storage::disk('public')->exists($merch->main_image)) {
            Storage::disk('public')->delete($merch->main_image);
        }
        
        $merch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Товар удален'
        ]);
    }

    /**
     * Оформить покупку мерча за виртуальную валюту.
     */
    public function purchase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'merch_id' => 'required|integer|exists:merches,id',
            'quantity' => 'required|integer|min:1',
            'delivery_type' => 'required|in:delivery,pickup',
            'shipping_address' => 'nullable|string|max:1000',
            'recipient_name' => 'nullable|string|max:255',
            'recipient_phone' => 'nullable|string|max:50',
            'additional_info' => 'nullable|string|max:500',
        ]);

        $isPickup = $validated['delivery_type'] === 'pickup';
        if (!$isPickup && empty(trim($validated['shipping_address'] ?? ''))) {
            return response()->json(['message' => 'Укажите адрес доставки'], 422);
        }

        $merch = Merch::findOrFail($validated['merch_id']);
        if ($merch->stock_quantity < $validated['quantity']) {
            return response()->json(['message' => 'Недостаточно товара на складе'], 422);
        }

        $totalCoins = (int) round((float) $merch->price * $validated['quantity']);
        $user = $request->user();
        if ((int) ($user->balance ?? 0) < $totalCoins) {
            return response()->json(['message' => "Недостаточно средств на балансе. Нужно: {$totalCoins} монет."], 422);
        }

        $shippingAddress = $isPickup ? 'Самовывоз на фестивале' : trim($validated['shipping_address']);

        $orderNumber = 'ORD-' . strtoupper(uniqid());
        $order = Order::create([
            'order_number' => $orderNumber,
            'user_id' => $user->id,
            'merch_id' => $merch->id,
            'quantity' => $validated['quantity'],
            'total_amount' => $totalCoins,
            'shipping_address' => $shippingAddress,
            'status' => 'processing',
        ]);

        $merch->reduceStock($validated['quantity']);
        $user->decrement('balance', $totalCoins);
        $user->balanceHistories()->create([
            'amount' => -$totalCoins,
            'type' => 'merch_purchase',
            'related_order_id' => $order->id,
        ]);

        return response()->json([
            'message' => 'Заказ оформлен',
            'order_id' => $order->id,
            'order_number' => $orderNumber,
        ]);
    }

    /**
     * Мои заказы.
     */
    public function myOrders(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('merch:id,name,slug,main_image')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'merch_id' => $order->merch_id,
                    'merch' => $order->merch ? [
                        'id' => $order->merch->id,
                        'name' => $order->merch->name,
                        'slug' => $order->merch->slug,
                        'main_image' => $order->merch->main_image_url,
                    ] : null,
                    'quantity' => $order->quantity,
                    'total_amount' => (float) $order->total_amount,
                    'shipping_address' => $order->shipping_address,
                    'status' => $order->status,
                    'created_at' => $order->created_at?->toIso8601String(),
                ];
            });
            
        return response()->json(['orders' => $orders]);
    }
}