<?php

namespace Database\Seeders;

use App\Models\Bet;
use App\Models\MatchGame;
use App\Models\User;
use Illuminate\Database\Seeder;

class BetsSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание ставок...\n";

        $users = User::where('role', 'user')->get();
        $matches = MatchGame::where('status', 'scheduled')
            ->whereNotNull('team1_id')
            ->whereNotNull('team2_id')
            ->get();
        
        if ($users->isEmpty() || $matches->isEmpty()) {
            echo "Нет пользователей или матчей для создания ставок\n";
            return;
        }

        $betOnOptions = ['team1_win', 'team2_win', 'draw'];
        
        // Активные пользователи, которые делают ставки
        $activeBettors = [3, 4, 5, 6, 7, 8, 11, 12, 14, 15];
        
        foreach ($users as $user) {
            if (!in_array($user->id, $activeBettors)) {
                continue;
            }
            
            // Количество ставок от 1 до 4
            $betsCount = rand(1, 4);
            
            for ($i = 0; $i < $betsCount; $i++) {
                $match = $matches->random();
                $betOn = $betOnOptions[array_rand($betOnOptions)];
                
                // Сумма ставки зависит от пользователя
                if (in_array($user->id, [5, 11, 15])) {
                    $coinsAmount = [500, 1000, 2000][array_rand([500, 1000, 2000])];
                } elseif (in_array($user->id, [3, 4, 7, 8, 12, 14])) {
                    $coinsAmount = [200, 300, 500][array_rand([200, 300, 500])];
                } else {
                    $coinsAmount = [50, 100, 200][array_rand([50, 100, 200])];
                }
                
                // Получаем коэффициенты из матча
                $odds = match ($betOn) {
                    'team1_win' => (float) ($match->odds_team1 ?? 1.9),
                    'team2_win' => (float) ($match->odds_team2 ?? 1.9),
                    'draw' => (float) ($match->odds_draw ?? 3.2),
                    default => 1.9,
                };
                
                $potentialWin = (int) ($coinsAmount * $odds);
                
                // Статус ставки (только активные, так как матчи ещё не начались)
                $status = 'active';
                $actualWin = null;
                
                Bet::create([
                    'user_id' => $user->id,
                    'match_id' => $match->id,
                    'bet_on' => $betOn,
                    'coins_amount' => $coinsAmount,
                    'odds' => $odds,
                    'potential_win' => $potentialWin,
                    'status' => $status,
                    'actual_win' => $actualWin,
                    'created_at' => now()->subHours(rand(1, 72)),
                    'updated_at' => now()->subHours(rand(0, 24)),
                ]);
            }
        }
    }
}