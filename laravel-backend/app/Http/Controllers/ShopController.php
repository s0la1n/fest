<?php

namespace App\Http\Controllers;

use App\Models\Merch;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ShopController extends Controller
{
    /**
     * Список товаров магазина.
     */
    public function index(): JsonResponse
    {
        $products = Merch::orderBy('name')->get([
            'id', 'name', 'slug', 'description', 'price', 'stock_quantity', 'main_image'
        ]);
        return response()->json($products);
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
            ->get();
        return response()->json(['orders' => $orders]);
    }
}
