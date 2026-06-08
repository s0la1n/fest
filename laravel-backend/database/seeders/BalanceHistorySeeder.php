<?php

namespace Database\Seeders;

use App\Models\BalanceHistory;
use App\Models\Bet;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BalanceHistorySeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание реалистичной истории баланса...\n";

        $users = User::where('role', 'user')->get();
        
        // Сначала очищаем существующую историю и сбрасываем балансы
        BalanceHistory::truncate();
        
        foreach ($users as $user) {
            DB::table('users')->where('id', $user->id)->update(['balance' => 0]);
        }
        
        // 1. Бонус за регистрацию (500 монет)
        echo "  Бонусы за регистрацию...\n";
        foreach ($users as $user) {
            BalanceHistory::create([
                'user_id' => $user->id,
                'amount' => 500,
                'type' => 'registration_bonus',
                'created_at' => $user->created_at,
                'updated_at' => $user->created_at,
            ]);
            $user->increment('balance', 500);
        }
        
        // 2. Бонус за заполнение профиля (100 монет, если есть фамилия)
        echo "  Бонусы за заполнение профиля...\n";
        foreach ($users as $user) {
            if ($user->last_name && strlen(trim($user->last_name)) > 1) {
                BalanceHistory::create([
                    'user_id' => $user->id,
                    'amount' => 100,
                    'type' => 'profile_completion',
                    'created_at' => $user->created_at->addDays(1),
                    'updated_at' => $user->created_at->addDays(1),
                ]);
                $user->increment('balance', 100);
            }
        }
        
        // 3. Карточные бонусы (используем card_bonus)
        echo "  Бонусы от карточек...\n";
        $cardBonuses = [
            ['user_id' => 3, 'amount' => 50],
            ['user_id' => 4, 'amount' => 100],
            ['user_id' => 5, 'amount' => 200],
            ['user_id' => 6, 'amount' => 150],
            ['user_id' => 7, 'amount' => 100],
            ['user_id' => 8, 'amount' => 50],
            ['user_id' => 9, 'amount' => 300],
            ['user_id' => 10, 'amount' => 500],
            ['user_id' => 11, 'amount' => 200],
            ['user_id' => 12, 'amount' => 100],
            ['user_id' => 13, 'amount' => 150],
            ['user_id' => 14, 'amount' => 250],
            ['user_id' => 15, 'amount' => 300],
        ];
        
        foreach ($cardBonuses as $bonus) {
            $user = User::find($bonus['user_id']);
            if ($user) {
                BalanceHistory::create([
                    'user_id' => $user->id,
                    'amount' => $bonus['amount'],
                    'type' => 'card_bonus',
                    'created_at' => now()->subDays(rand(5, 20)),
                    'updated_at' => now()->subDays(rand(5, 20)),
                ]);
                $user->increment('balance', $bonus['amount']);
            }
        }
        
        // 4. Победы в турнирах и косплее (используем card_bonus как альтернативу)
        echo "  Бонусы за победы (через card_bonus)...\n";
        $activityBonuses = [
            ['user_id' => 5, 'amount' => 5000],
            ['user_id' => 11, 'amount' => 4000],
            ['user_id' => 3, 'amount' => 3000],
            ['user_id' => 14, 'amount' => 3000],
            ['user_id' => 4, 'amount' => 2000],
            ['user_id' => 7, 'amount' => 2000],
            ['user_id' => 6, 'amount' => 1500],
            ['user_id' => 8, 'amount' => 1000],
        ];
        
        foreach ($activityBonuses as $bonus) {
            $user = User::find($bonus['user_id']);
            if ($user) {
                BalanceHistory::create([
                    'user_id' => $user->id,
                    'amount' => $bonus['amount'],
                    'type' => 'card_bonus', // используем существующий тип
                    'created_at' => now()->subDays(rand(3, 15)),
                    'updated_at' => now()->subDays(rand(3, 15)),
                ]);
                $user->increment('balance', $bonus['amount']);
            }
        }
        
        // 5. Покупки мерча (списания)
        echo "  Покупки мерча...\n";
        $orders = Order::with('merch')->where('status', '!=', 'cancelled')->get();
        foreach ($orders as $order) {
            $user = User::find($order->user_id);
            if ($user && $user->balance >= $order->total_amount) {
                BalanceHistory::create([
                    'user_id' => $user->id,
                    'amount' => -$order->total_amount,
                    'type' => 'merch_purchase',
                    'related_order_id' => $order->id,
                    'created_at' => $order->created_at,
                    'updated_at' => $order->created_at,
                ]);
                $user->decrement('balance', $order->total_amount);
                echo "    Списанo {$order->total_amount} монет у пользователя {$user->id} за {$order->merch->name}\n";
            }
        }
        
        // 6. Ставки и выигрыши
        echo "  Ставки и выигрыши...\n";
        $bets = Bet::with('match')->get();
        foreach ($bets as $bet) {
            $user = User::find($bet->user_id);
            if (!$user) continue;
            
            // Списание за ставку
            if ($user->balance >= $bet->coins_amount) {
                BalanceHistory::create([
                    'user_id' => $user->id,
                    'amount' => -$bet->coins_amount,
                    'type' => 'bet_placement',
                    'related_bet_id' => $bet->id,
                    'created_at' => $bet->created_at,
                    'updated_at' => $bet->created_at,
                ]);
                $user->decrement('balance', $bet->coins_amount);
            }
            
            // Выигрыш по ставке
            if ($bet->status === 'won' && $bet->actual_win && $bet->actual_win > 0) {
                BalanceHistory::create([
                    'user_id' => $user->id,
                    'amount' => $bet->actual_win,
                    'type' => 'bet_win',
                    'related_bet_id' => $bet->id,
                    'created_at' => $bet->updated_at,
                    'updated_at' => $bet->updated_at,
                ]);
                $user->increment('balance', $bet->actual_win);
            }
        }
        
        // Итоговый вывод балансов
        echo "\n  Итоговые балансы пользователей:\n";
        foreach (User::where('role', 'user')->get() as $user) {
            echo "    Пользователь {$user->id} ({$user->login}): {$user->balance} монет\n";
        }
        
        $totalHistory = BalanceHistory::count();
        echo "\n✅ Создано {$totalHistory} записей истории баланса\n";
    }
}