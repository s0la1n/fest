<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    /**
     * Статистика для админ-панели.
     */
    public function statistics(): JsonResponse
    {
        $usersCount = User::count();
        $ticketsSold = Ticket::where('payment_status', 'paid')->count();
        $ordersCount = Order::count();
        $merchItemsSold = (int) Order::sum('quantity');

        return response()->json([
            'users_count' => $usersCount,
            'tickets_sold' => $ticketsSold,
            'tickets_count' => $ticketsSold,
            'orders_count' => $ordersCount,
            'merch_items_sold' => $merchItemsSold,
        ]);
    }
}
