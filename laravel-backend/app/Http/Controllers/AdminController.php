<?php

namespace App\Http\Controllers;

use App\Models\Bet;
use App\Models\Card;
use App\Models\Cosplayer;
use App\Models\MatchGame;
use App\Models\Merch;
use App\Models\Order;
use App\Models\Team;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Статистика для админ-панели.
     */
    public function statistics(): JsonResponse
    {
        $usersCount = User::count();
        $activeUsers = User::where('created_at', '>=', now()->subDays(30))->count();
        $newUsersToday = User::whereDate('created_at', today())->count();
        $newUsersWeek = User::where('created_at', '>=', now()->subDays(7))->count();
        $newUsersMonth = User::where('created_at', '>=', now()->subDays(30))->count();
        
        $ticketsSold = Ticket::where('payment_status', 'paid')->count();
        $totalRevenue = Ticket::where('payment_status', 'paid')->sum('price');
        
        $ordersCount = Order::count();
        $merchItemsSold = (int) Order::sum('quantity');
        
        // Ставки
        $totalBets = Bet::count();
        $totalBetsAmount = Bet::sum('coins_amount');
        $totalWonBets = Bet::where('status', 'won')->count();
        $totalLostBets = Bet::where('status', 'lost')->count();
        $winRate = $totalBets > 0 ? round(($totalWonBets / $totalBets) * 100, 1) : 0;
        
        // Косплей
        $totalCosplayers = Cosplayer::count();
        $totalCosplayVotes = Cosplayer::sum('votes_count');
        
        // Турниры
        $totalTeams = Team::count();
        $totalMatches = MatchGame::count();
        $finishedMatches = MatchGame::where('status', 'finished')->count();
        
        // Карточки
        $totalCards = Card::count();
        $cardsUsed = Card::sum('used_quantity');
        
        // Топ пользователей по балансу
        $topUsers = User::orderBy('balance', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name ?: $u->login,
                'balance' => (int) $u->balance,
                'tickets_count' => $u->tickets()->count(),
                'bets_count' => $u->bets()->count(),
            ]);
        
        // Популярный мерч
        $popularMerch = Merch::orderBy('sold_quantity', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($m) => [
                'name' => $m->name,
                'sold' => $m->sold_quantity,
                'revenue' => $m->sold_quantity * $m->price,
            ]);
        
        // Ежедневная статистика за последние 7 дней
        $dailyStats = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dailyStats[] = [
                'date' => $date->format('d.m'),
                'users' => User::whereDate('created_at', $date)->count(),
                'tickets' => Ticket::whereDate('created_at', $date)->count(),
                'orders' => Order::whereDate('created_at', $date)->count(),
                'revenue' => Ticket::whereDate('created_at', $date)->where('payment_status', 'paid')->sum('price'),
            ];
        }
        
        return response()->json([
            'users_count' => $usersCount,
            'active_users' => $activeUsers,
            'new_users_today' => $newUsersToday,
            'new_users_week' => $newUsersWeek,
            'new_users_month' => $newUsersMonth,
            'tickets_sold' => $ticketsSold,
            'tickets_count' => $ticketsSold,
            'total_revenue' => (float) $totalRevenue,
            'orders_count' => $ordersCount,
            'merch_items_sold' => $merchItemsSold,
            'total_bets' => $totalBets,
            'total_bets_amount' => $totalBetsAmount,
            'total_won_bets' => $totalWonBets,
            'total_lost_bets' => $totalLostBets,
            'win_rate' => $winRate,
            'total_cosplayers' => $totalCosplayers,
            'total_cosplay_votes' => $totalCosplayVotes,
            'total_teams' => $totalTeams,
            'total_matches' => $totalMatches,
            'finished_matches' => $finishedMatches,
            'total_cards' => $totalCards,
            'cards_used' => $cardsUsed,
            'top_users' => $topUsers,
            'popular_merch' => $popularMerch,
            'daily_stats' => $dailyStats,
        ]);
    }

    /**
     * Получить все заказы (для админа)
     */
    public function getAllOrders(): JsonResponse
    {
        $orders = Order::with(['user', 'merch'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_id' => $order->user_id,
                    'user' => $order->user ? [
                        'id' => $order->user->id,
                        'name' => $order->user->name,
                        'login' => $order->user->login,
                        'email' => $order->user->email,
                    ] : null,
                    'merch_id' => $order->merch_id,
                    'merch' => $order->merch ? [
                        'id' => $order->merch->id,
                        'name' => $order->merch->name,
                        'main_image' => $order->merch->main_image_url, // ← ИСПРАВЛЕНО
                    ] : null,
                    'quantity' => $order->quantity,
                    'total_amount' => (float) $order->total_amount,
                    'shipping_address' => $order->shipping_address,
                    'status' => $order->status,
                    'created_at' => $order->created_at->toIso8601String(),
                ];
            });
        
        return response()->json(['orders' => $orders]);
    }

    /**
     * Получить один заказ
     */
    public function getOrder(int $id): JsonResponse
    {
        $order = Order::with(['user', 'merch'])->findOrFail($id);
        
        return response()->json([
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'user' => $order->user ? [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                ] : null,
                'merch' => $order->merch ? [
                    'name' => $order->merch->name,
                    'price' => (float) $order->merch->price,
                    'main_image' => $order->merch->main_image_url, // ← ИСПРАВЛЕНО (добавлено)
                ] : null,
                'quantity' => $order->quantity,
                'total_amount' => (float) $order->total_amount,
                'shipping_address' => $order->shipping_address,
                'status' => $order->status,
                'created_at' => $order->created_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Обновить статус заказа
     */
    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:processing,confirmed,shipped,cancelled',
        ]);
        
        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);
        
        return response()->json([
            'success' => true,
            'message' => 'Статус заказа обновлён',
            'order' => $order
        ]);
    }
}