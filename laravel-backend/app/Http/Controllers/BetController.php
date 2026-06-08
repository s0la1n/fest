<?php

namespace App\Http\Controllers;

use App\Models\Bet;
use App\Models\MatchGame;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BetController extends Controller
{
    /**
     * Получить список матчей для ставок
     */
    public function getMatches(): JsonResponse
    {
        $matches = MatchGame::with(['game:id,name', 'team1:id,team_name', 'team2:id,team_name'])
            ->whereIn('status', ['scheduled'])
            ->whereNotNull('team1_id')
            ->whereNotNull('team2_id')
            ->where('start_time', '>', now())
            ->orderBy('start_time')
            ->get()
            ->map(function ($match) {
                return [
                    'id' => $match->id,
                    'game_name' => $match->game->name,
                    'team1' => [
                        'id' => $match->team1->id,
                        'name' => $match->team1->team_name,
                    ],
                    'team2' => [
                        'id' => $match->team2->id,
                        'name' => $match->team2->team_name,
                    ],
                    'start_time' => $match->start_time->toIso8601String(),
                    'status' => $match->status,
                    'stage' => $match->stage,
                ];
            });

        return response()->json(['matches' => $matches]);
    }

    /**
     * Получить коэффициенты для матча
     */
    public function getOdds(int $matchId): JsonResponse
    {
        $match = MatchGame::with(['team1', 'team2'])->findOrFail($matchId);
        $team1Odds = (float) ($match->odds_team1 ?? 1.9);
        $team2Odds = (float) ($match->odds_team2 ?? 1.9);
        $drawOdds = (float) ($match->odds_draw ?? 3.2);
        
        return response()->json([
            'match_id' => $matchId,
            'team1' => [
                'id' => $match->team1->id,
                'name' => $match->team1->team_name,
                'odds' => round($team1Odds, 2)
            ],
            'team2' => [
                'id' => $match->team2->id,
                'name' => $match->team2->team_name,
                'odds' => round($team2Odds, 2)
            ],
            'draw' => [
                'odds' => round($drawOdds, 2)
            ]
        ]);
    }

    /**
     * Создать ставку
     */
    public function placeBet(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'match_id' => 'required|integer|exists:match_games,id',
            'bet_on' => 'required|in:team1_win,team2_win,draw',
            'coins_amount' => 'required|integer|min:10',
            'odds' => 'nullable|numeric|min:1.01'
        ]);

        $user = $request->user();
        $match = MatchGame::findOrFail($validated['match_id']);
        
        $existingBet = Bet::where('user_id', $user->id)
            ->where('match_id', $match->id)
            ->whereIn('status', ['pending', 'active'])
            ->latest('id')
            ->first();

        if (!$match->team1_id || !$match->team2_id || $match->status === 'cancelled') {
            return response()->json(['error' => 'Ставки для этого матча недоступны'], 400);
        }
        
        // Ставки/изменение ставки возможны только ДО старта матча.
        if ($match->start_time <= now() || in_array($match->status, ['live', 'finished'])) {
            return response()->json(['error' => 'Матч уже начался. Изменение ставки недоступно'], 400);
        }

        $effectiveBalance = (int) $user->balance + (int) ($existingBet?->coins_amount ?? 0);
        if ($effectiveBalance < (int) $validated['coins_amount']) {
            return response()->json([
                'error' => 'Недостаточно средств',
                'balance' => $effectiveBalance,
                'required' => $validated['coins_amount']
            ], 400);
        }

        // Определяем коэффициент в зависимости от выбранного исхода
        $odds = match ($validated['bet_on']) {
            'team1_win' => (float) ($match->odds_team1 ?? 1.9),
            'team2_win' => (float) ($match->odds_team2 ?? 1.9),
            'draw' => (float) ($match->odds_draw ?? 3.2),
            default => 1.9,
        };

        $potentialWin = (int) ($validated['coins_amount'] * $odds);

        DB::transaction(function () use ($user, $match, $validated, $potentialWin, $existingBet, $odds) {
            if ($existingBet) {
                // До старта разрешаем менять ставку: возвращаем старую сумму и применяем новую.
                $user->increment('balance', (int) $existingBet->coins_amount);
                
                $existingBet->update([
                    'bet_on' => $validated['bet_on'],
                    'coins_amount' => $validated['coins_amount'],
                    'odds' => $odds,
                    'potential_win' => $potentialWin,
                    'status' => 'active',
                    'actual_win' => null,
                ]);
                $bet = $existingBet->fresh();
            } else {
                $bet = Bet::create([
                    'user_id' => $user->id,
                    'match_id' => $validated['match_id'],
                    'bet_on' => $validated['bet_on'],
                    'coins_amount' => $validated['coins_amount'],
                    'odds' => $odds,
                    'potential_win' => $potentialWin,
                    'status' => 'active',
                ]);
            }

            // Списываем монеты с баланса
            $user->decrement('balance', $validated['coins_amount']);
            
            // Записываем историю баланса
            $user->balanceHistories()->create([
                'amount' => -$validated['coins_amount'],
                'type' => 'bet_placement',
                'related_bet_id' => $bet->id,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Ставка успешно оформлена',
            'potential_win' => $potentialWin,
            'new_balance' => $user->fresh()->balance
        ]);
    }

    /**
     * Получить список ставок пользователя
     */
    public function getUserBets(Request $request): JsonResponse
    {
        $bets = $request->user()
            ->bets()
            ->with(['match.game', 'match.team1', 'match.team2'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($bet) {
                if ($bet->match && $bet->match->status === 'finished' && in_array($bet->status, ['active', 'pending'])) {
                    $bet->calculateResult();
                    $bet = $bet->fresh(['match.game', 'match.team1', 'match.team2']);
                }

                $betOnText = match($bet->bet_on) {
                    'team1_win' => $bet->match->team1->team_name ?? 'Команда 1',
                    'team2_win' => $bet->match->team2->team_name ?? 'Команда 2',
                    'draw' => 'Ничья',
                    default => $bet->bet_on,
                };

                $statusText = match($bet->status) {
                    'pending' => 'Ожидает',
                    'active' => 'Активна',
                    'won' => 'Выиграла',
                    'lost' => 'Проиграла',
                    'returned' => 'Возвращена',
                    'cancelled' => 'Отменена',
                    default => $bet->status,
                };

                $statusColor = match($bet->status) {
                    'won' => 'text-green-500',
                    'lost' => 'text-red-500',
                    'active' => 'text-yellow-500',
                    default => 'text-slate-400',
                };

                return [
                    'id' => $bet->id,
                    'match' => [
                        'id' => $bet->match->id,
                        'game_name' => $bet->match->game->name ?? 'Неизвестная игра',
                        'team1_name' => $bet->match->team1->team_name ?? 'Команда 1',
                        'team2_name' => $bet->match->team2->team_name ?? 'Команда 2',
                        'start_time' => $bet->match->start_time?->toIso8601String(),
                    ],
                    'bet_on' => $bet->bet_on,
                    'bet_on_text' => $betOnText,
                    'coins_amount' => $bet->coins_amount,
                    'odds' => (float) $bet->odds,
                    'potential_win' => $bet->potential_win,
                    'actual_win' => $bet->actual_win,
                    'status' => $bet->status,
                    'status_text' => $statusText,
                    'status_color' => $statusColor,
                    'created_at' => $bet->created_at->toIso8601String(),
                ];
            });

        // Статистика ставок
        $stats = [
            'total_bets' => $bets->count(),
            'total_wagered' => $bets->sum('coins_amount'),
            'total_won' => $bets->where('status', 'won')->sum('actual_win'),
            'wins_count' => $bets->where('status', 'won')->count(),
            'losses_count' => $bets->where('status', 'lost')->count(),
        ];

        return response()->json([
            'bets' => $bets,
            'stats' => $stats,
        ]);
    }

    /**
     * Получить детали конкретной ставки
     */
    public function getBet(int $id, Request $request): JsonResponse
    {
        $bet = Bet::with(['match.game', 'match.team1', 'match.team2'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json(['bet' => $bet]);
    }
}