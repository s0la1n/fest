<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Bet;
use App\Models\Team;
use App\Models\TeamPlayer;
use App\Models\MatchGame;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TournamentController extends Controller
{
    private const STAGE_ORDER = [
        'quarterfinal',
        'semifinal',
        'final',
    ];

    private const LOCKED_STATUSES = ['live', 'finished'];
    /**
     * Получить все команды
     */
    public function getAllTeams(): JsonResponse
    {
        $teams = Team::with(['game', 'players'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($team) => [
                'id' => $team->id,
                'game_id' => $team->game_id,
                'game_name' => $team->game->name,
                'team_name' => $team->team_name,
                'tag' => $team->tag,
                'city' => $team->city,
                'status' => $team->status,
                'players' => $team->players->map(fn ($player) => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'nickname' => $player->nickname,
                    'role' => $player->role,
                ]),
                'created_at' => $team->created_at?->toIso8601String(),
            ]);

        $games = Game::all(['id', 'name']);

        return response()->json([
            'teams' => $teams,
            'games' => $games,
        ]);
    }

    /**
     * Получить одну команду
     */
    public function getTeam(int $id): JsonResponse
    {
        $team = Team::with(['game', 'players'])->findOrFail($id);
        
        return response()->json([
            'team' => [
                'id' => $team->id,
                'game_id' => $team->game_id,
                'team_name' => $team->team_name,
                'tag' => $team->tag,
                'city' => $team->city,
                'status' => $team->status,
                'players' => $team->players,
            ]
        ]);
    }

    /**
     * Создать команду
     */
    public function createTeam(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game_id' => 'required|integer|exists:games,id',
            'team_name' => 'required|string|max:255',
            'tag' => 'required|string|max:10|unique:teams,tag',
            'city' => 'required|string|max:255',
            'players' => 'nullable|array',
            'players.*.name' => 'nullable|string|max:255',
            'players.*.nickname' => 'nullable|string|max:255',
            'players.*.role' => 'in:captain,player',
        ]);

        $activeTeamsCount = Team::where('game_id', $validated['game_id'])
            ->where('status', 'active')
            ->count();
        if ($activeTeamsCount >= 8) {
            return response()->json([
                'error' => 'Достигнуто максимальное количество активных команд (8) для этой игры',
            ], 422);
        }

        DB::transaction(function () use ($validated, &$team) {
            $team = Team::create([
                'game_id' => $validated['game_id'],
                'team_name' => $validated['team_name'],
                'tag' => strtoupper($validated['tag']),
                'city' => $validated['city'],
                'status' => 'active',
            ]);

            if (isset($validated['players']) && is_array($validated['players'])) {
                foreach ($validated['players'] as $player) {
                    if (!empty($player['nickname'])) {
                        $team->players()->create([
                            'name' => $player['name'] ?? null,
                            'nickname' => $player['nickname'],
                            'role' => $player['role'] ?? 'player',
                        ]);
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'team' => $team,
            'message' => 'Команда создана'
        ], 201);
    }

    /**
     * Обновить команду
     */
    public function updateTeam(Request $request, int $id): JsonResponse
    {
        $team = Team::findOrFail($id);
        
        $validated = $request->validate([
            'game_id' => 'sometimes|integer|exists:games,id',
            'team_name' => 'sometimes|string|max:255',
            'tag' => 'sometimes|string|max:10|unique:teams,tag,' . $id,
            'city' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (($validated['status'] ?? null) === 'inactive') {
            $hasLockedMatches = MatchGame::where('game_id', $team->game_id)
                ->whereIn('status', self::LOCKED_STATUSES)
                ->where(function ($q) use ($id) {
                    $q->where('team1_id', $id)->orWhere('team2_id', $id);
                })
                ->exists();

            if ($hasLockedMatches) {
                return response()->json([
                    'message' => 'Нельзя деактивировать команду из матча "в эфире" или "завершён".',
                ], 422);
            }
        }

        DB::transaction(function () use ($team, $validated, $id) {
            $team->update($validated);

            if (($validated['status'] ?? null) === 'inactive') {
                $this->removeTeamFromOpenMatches((int) $id, (int) $team->game_id);
            }
        });

        return response()->json([
            'success' => true,
            'team' => $team->fresh(['game', 'players']),
            'message' => 'Команда обновлена',
        ]);
    }

    /**
     * Удалить команду
     */
    public function deleteTeam(int $id): JsonResponse
    {
        $team = Team::findOrFail($id);
        
        if ($team->matchGamesAsTeam1()->exists() || $team->matchGamesAsTeam2()->exists()) {
            return response()->json([
                'error' => 'Нельзя удалить команду, которая участвует в матчах'
            ], 400);
        }
        
        $team->players()->delete();
        $team->delete();

        return response()->json([
            'success' => true,
            'message' => 'Команда удалена'
        ]);
    }

    /**
     * Получить все матчи
     */
    public function getAllMatches(Request $request): JsonResponse
    {
        $query = MatchGame::with(['game', 'team1', 'team2', 'winner']);

        if ($request->filled('game_id')) {
            $query->where('game_id', (int) $request->query('game_id'));
        }

        $matches = $query
            ->orderBy('start_time')
            ->orderBy('id')
            ->get()
            ->map(fn ($match) => [
                'id' => $match->id,
                'game_id' => $match->game_id,
                'game_name' => $match->game->name,
                'team1_id' => $match->team1_id,
                'team2_id' => $match->team2_id,
                'team1' => $match->team1 ? [
                    'id' => $match->team1->id,
                    'name' => $match->team1->team_name,
                    'tag' => $match->team1->tag,
                ] : null,
                'team2' => $match->team2 ? [
                    'id' => $match->team2->id,
                    'name' => $match->team2->team_name,
                    'tag' => $match->team2->tag,
                ] : null,
                'winner_id' => $match->winner_id,
                'stage' => $match->stage,
                'status' => $match->status,
                'start_time' => $match->start_time?->toIso8601String(),
                'team1_score' => $match->team1_score,
                'team2_score' => $match->team2_score,
                'odds_team1' => $match->odds_team1 !== null ? (float) $match->odds_team1 : null,
                'odds_team2' => $match->odds_team2 !== null ? (float) $match->odds_team2 : null,
                'odds_draw' => $match->odds_draw !== null ? (float) $match->odds_draw : null,
            ]);

        return response()->json(['matches' => $matches]);
    }

    /**
     * Получить команды для конкретной игры
     */
    public function getTeamsByGame($gameId): JsonResponse
    {
        $gameId = (int) $gameId;

        $allTeams = Team::where('game_id', $gameId)->orderBy('team_name')->get();
        $teams = $allTeams
            ->where('status', 'active')
            ->values()
            ->map(fn ($team) => [
                'id' => $team->id,
                'team_name' => $team->team_name,
                'tag' => $team->tag,
                'city' => $team->city,
                'status' => $team->status,
            ]);

        return response()->json([
            'teams' => $teams,
            'stats' => [
                'active' => $allTeams->where('status', 'active')->count(),
                'inactive' => $allTeams->where('status', 'inactive')->count(),
                'total' => $allTeams->count(),
                'has_bracket' => MatchGame::where('game_id', $gameId)->exists(),
            ],
        ]);
    }

    /**
     * Обновить команды в любом матче сетки.
     */
    public function updateMatchTeam(Request $request, int $id): JsonResponse
    {
        $match = MatchGame::findOrFail($id);
        
        $validated = $request->validate([
            'team1_id' => 'nullable|integer|exists:teams,id',
            'team2_id' => 'nullable|integer|exists:teams,id',
        ]);
        
        $updateData = [];
        if (array_key_exists('team1_id', $validated)) {
            $updateData['team1_id'] = $validated['team1_id'];
        }
        if (array_key_exists('team2_id', $validated)) {
            $updateData['team2_id'] = $validated['team2_id'];
        }
        
        $team1Id = $updateData['team1_id'] ?? $match->team1_id;
        $team2Id = $updateData['team2_id'] ?? $match->team2_id;

        if ($team1Id !== null && $team2Id !== null && (int) $team1Id === (int) $team2Id) {
            return response()->json([
                'message' => 'В одном матче нельзя назначить одну и ту же команду в обе позиции',
            ], 422);
        }

        if ($match->status !== 'pending') {
            return response()->json([
                'message' => 'Команды можно менять только у матчей со статусом "pending".',
            ], 422);
        }

        foreach ([$team1Id, $team2Id] as $teamId) {
            if ($teamId === null) {
                continue;
            }
            $team = Team::find($teamId);
            if (!$team || (int) $team->game_id !== (int) $match->game_id) {
                return response()->json([
                    'message' => 'Команда должна относиться к той же игре, что и матч',
                ], 422);
            }
            if ($team->status !== 'active') {
                return response()->json([
                    'message' => 'В сетку можно назначать только активные команды.',
                ], 422);
            }
        }

        // При ручной замене команд результат матча нужно сбросить.
        $updateData['winner_id'] = null;
        $updateData['team1_score'] = 0;
        $updateData['team2_score'] = 0;
        $updateData['end_time'] = null;
        $updateData['status'] = ($team1Id && $team2Id) ? 'pending' : 'cancelled';
        
        DB::transaction(function () use ($match, $updateData) {
            $match->update($updateData);
            // Перестроение наследников после ручных правок состава.
            $this->rebuildNextRoundsForGame((int) $match->game_id);
        });
        
        return response()->json([
            'success' => true,
            'match' => $match->fresh(),
            'message' => 'Матч обновлен'
        ]);
    }

    /**
     * Обновить победителя матча и автоматически заполнить следующий этап
     */
    public function updateMatchWinner(Request $request, int $id): JsonResponse
    {
        $match = MatchGame::findOrFail($id);
        
        if ($match->winner_id !== null) {
            return response()->json([
                'message' => 'Результат уже зафиксирован и не может быть изменён.',
            ], 422);
        }

        $validated = $request->validate([
            'team1_score' => 'required|integer|min:0',
            'team2_score' => 'required|integer|min:0',
        ]);
        
        if ($match->status !== 'finished') {
            return response()->json([
                'message' => 'Счет можно вносить только для матчей со статусом "finished"',
            ], 422);
        }

        if (!$match->team1_id || !$match->team2_id) {
            return response()->json([
                'message' => 'Нельзя выставить победителя: в матче не выбраны обе команды',
            ], 422);
        }
        if ($validated['team1_score'] === $validated['team2_score']) {
            return response()->json([
                'message' => 'Ничья не поддерживается в плей-офф. Укажите победителя.',
            ], 422);
        }
        $winnerId = $validated['team1_score'] > $validated['team2_score'] ? $match->team1_id : $match->team2_id;
        
        // Обновляем текущий матч
        $match->update([
            'team1_score' => $validated['team1_score'],
            'team2_score' => $validated['team2_score'],
            'status' => 'finished',
            'winner_id' => $winnerId,
            'end_time' => now(),
        ]);
        
        $this->pushWinnerToNextMatch($match, (int) $winnerId);
        $this->settleBetsForMatch((int) $match->id);
        
        return response()->json([
            'success' => true,
            'match' => $match,
            'message' => 'Результат матча сохранен'
        ]);
    }

    /**
     * Обновить статус/дату матча организатором.
     * Счет вводится отдельным действием только когда статус finished.
     */
    public function updateMatchMeta(Request $request, int $id): JsonResponse
    {
        $match = MatchGame::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,scheduled,live,finished,cancelled',
            'start_time' => 'sometimes|date',
            'odds_team1' => 'sometimes|nullable|numeric|min:1.01|max:99.99',
            'odds_team2' => 'sometimes|nullable|numeric|min:1.01|max:99.99',
            'odds_draw' => 'sometimes|nullable|numeric|min:1.01|max:99.99',
        ]);

        if ($match->status === 'finished') {
            return response()->json([
                'message' => 'Завершённый матч нельзя редактировать.',
            ], 422);
        }

        $updateData = [];
        if (array_key_exists('status', $validated)) {
            $updateData['status'] = $validated['status'];
        }
        if (array_key_exists('start_time', $validated)) {
            $updateData['start_time'] = $validated['start_time'];
        }
        if (array_key_exists('odds_team1', $validated)) {
            $updateData['odds_team1'] = $validated['odds_team1'];
        }
        if (array_key_exists('odds_team2', $validated)) {
            $updateData['odds_team2'] = $validated['odds_team2'];
        }
        if (array_key_exists('odds_draw', $validated)) {
            $updateData['odds_draw'] = $validated['odds_draw'];
        }

        $nextStatus = $updateData['status'] ?? $match->status;

        if ($match->status !== 'pending' && array_key_exists('status', $updateData) && $nextStatus === 'pending') {
            return response()->json([
                'message' => 'Нельзя вернуть матч в статус "pending".',
            ], 422);
        }

        $allowedTransitions = [
            'pending' => ['pending', 'scheduled', 'cancelled'],
            'scheduled' => ['live', 'cancelled', 'scheduled'],
            'cancelled' => ['scheduled', 'cancelled'],
            'live' => ['finished'],
            'finished' => [],
        ];

        if (array_key_exists('status', $updateData) && !in_array($nextStatus, $allowedTransitions[$match->status] ?? [], true)) {
            return response()->json([
                'message' => "Недопустимый переход статуса: {$match->status} -> {$nextStatus}",
            ], 422);
        }

        if ($nextStatus === 'finished' && (!$match->team1_id || !$match->team2_id)) {
            return response()->json([
                'message' => 'Нельзя завершить матч без двух назначенных команд',
            ], 422);
        }

        $changesData = array_intersect_key($updateData, array_flip(['start_time', 'odds_team1', 'odds_team2', 'odds_draw']));
        if (!empty($changesData) && $match->status !== 'pending') {
            return response()->json([
                'message' => 'Дату и коэффициенты можно редактировать только в статусе "pending".',
            ], 422);
        }

        if (array_key_exists('status', $updateData) && in_array($nextStatus, ['scheduled', 'live'], true)) {
            $startTime = $updateData['start_time'] ?? $match->start_time;
            if (!$startTime) {
                return response()->json([
                    'message' => 'Перед публикацией матча укажите дату и время.',
                ], 422);
            }
        }

        $match->update($updateData);

        return response()->json([
            'success' => true,
            'match' => $match->fresh(['game', 'team1', 'team2']),
            'message' => 'Параметры матча обновлены',
        ]);
    }

    /**
     * Сгенерировать полную сетку для игры.
     * Поддержка: 2..32 активных команд (авто-bye при неполной степени двойки).
     */
    public function createFullBracket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game_id' => 'required|integer|exists:games,id',
        ]);

        $gameId = (int) $validated['game_id'];
        $teams = Team::where('game_id', $gameId)
            ->where('status', 'active')
            ->orderBy('id')
            ->get(['id']);

        $teamCount = $teams->count();
        if ($teamCount < 2) {
            return response()->json(['message' => 'Для создания сетки нужно минимум 2 активные команды'], 422);
        }
        if ($teamCount > 8) {
            return response()->json(['message' => 'Пока поддерживается максимум 8 команд на игру'], 422);
        }

        $size = $this->resolveBracketSize($teamCount);
        $rounds = (int) log($size, 2);
        $teamIds = $teams->pluck('id')->all();
        $slots = array_pad($teamIds, $size, null);

        DB::transaction(function () use ($gameId, $rounds, $size, $slots) {
            MatchGame::where('game_id', $gameId)->delete();

            $previousRoundMatchIds = [];
            $roundMatchIds = [];

            for ($round = 1; $round <= $rounds; $round++) {
                $matchesInRound = (int) ($size / (2 ** $round));
                $teamsInRound = $matchesInRound * 2;
                $stage = $this->resolveStageByRoundSize($teamsInRound);
                $roundMatchIds = [];

                for ($i = 0; $i < $matchesInRound; $i++) {
                    $team1Id = null;
                    $team2Id = null;
                    $status = 'cancelled';
                    $winnerId = null;
                    $score1 = 0;
                    $score2 = 0;
                    $endTime = null;

                    if ($round === 1) {
                        $team1Id = $slots[$i * 2] ?? null;
                        $team2Id = $slots[$i * 2 + 1] ?? null;

                        if ($team1Id && $team2Id) {
                            $status = 'pending';
                        } elseif ($team1Id || $team2Id) {
                            // bye: авто-проход
                            $status = 'finished';
                            $winnerId = $team1Id ?: $team2Id;
                            $score1 = $team1Id ? 1 : 0;
                            $score2 = $team2Id ? 1 : 0;
                            $endTime = now();
                        }
                    }

                    $match = MatchGame::create([
                        'game_id' => $gameId,
                        'team1_id' => $team1Id,
                        'team2_id' => $team2Id,
                        'winner_id' => $winnerId,
                        'match_code' => 'M-' . $gameId . '-' . $round . '-' . ($i + 1),
                        'stage' => $stage,
                        'status' => $status,
                        'start_time' => now()->addHours($round * 2 + $i),
                        'end_time' => $endTime,
                        'team1_score' => $score1,
                        'team2_score' => $score2,
                    ]);

                    $roundMatchIds[] = $match->id;
                }

                // перенос авто-победителей (bye) в следующий раунд
                if ($round > 1 && !empty($previousRoundMatchIds)) {
                    foreach ($roundMatchIds as $nextIdx => $nextMatchId) {
                        $left = MatchGame::find($previousRoundMatchIds[$nextIdx * 2] ?? 0);
                        $right = MatchGame::find($previousRoundMatchIds[$nextIdx * 2 + 1] ?? 0);
                        $nextMatch = MatchGame::find($nextMatchId);
                        if (!$nextMatch) {
                            continue;
                        }

                        $leftWinner = $left?->winner_id;
                        $rightWinner = $right?->winner_id;

                        $update = [
                            'team1_id' => $leftWinner,
                            'team2_id' => $rightWinner,
                            'winner_id' => null,
                            'team1_score' => 0,
                            'team2_score' => 0,
                            'end_time' => null,
                        ];

                        if ($leftWinner && $rightWinner) {
                            $update['status'] = 'pending';
                        } elseif ($leftWinner || $rightWinner) {
                            $update['status'] = 'finished';
                            $update['winner_id'] = $leftWinner ?: $rightWinner;
                            $update['team1_score'] = $leftWinner ? 1 : 0;
                            $update['team2_score'] = $rightWinner ? 1 : 0;
                            $update['end_time'] = now();
                        } else {
                            $update['status'] = 'cancelled';
                        }

                        $nextMatch->update($update);
                    }
                }

                $previousRoundMatchIds = $roundMatchIds;
            }

            $this->rebuildNextRoundsForGame($gameId);
        });

        return response()->json([
            'success' => true,
            'message' => "Сетка создана. Команд: {$teamCount}",
        ]);
    }

    private function resolveStageByRoundSize(int $teamsInRound): string
    {
        if ($teamsInRound >= 8) {
            return 'quarterfinal';
        }

        if ($teamsInRound === 4) {
            return 'semifinal';
        }

        return 'final';
    }

    private function resolveBracketSize(int $teamCount): int
    {
        $size = 2;
        while ($size < $teamCount) {
            $size *= 2;
        }

        return min($size, 8);
    }

    private function getNextMatch(MatchGame $match): ?MatchGame
    {
        $currentStageIndex = array_search($match->stage, self::STAGE_ORDER, true);
        if ($currentStageIndex === false || $match->stage === 'final') {
            return null;
        }

        $nextStage = self::STAGE_ORDER[$currentStageIndex + 1] ?? null;
        if (!$nextStage) {
            return null;
        }

        $currentStageMatches = MatchGame::where('game_id', $match->game_id)
            ->where('stage', $match->stage)
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        $matchIndex = $currentStageMatches->search(fn ($m) => (int) $m->id === (int) $match->id);
        if ($matchIndex === false) {
            return null;
        }

        $nextMatchIndex = (int) floor($matchIndex / 2);
        $nextMatches = MatchGame::where('game_id', $match->game_id)
            ->where('stage', $nextStage)
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        return $nextMatches[$nextMatchIndex] ?? null;
    }

    private function pushWinnerToNextMatch(MatchGame $match, int $winnerId): void
    {
        $nextMatch = $this->getNextMatch($match);
        if (!$nextMatch) {
            return;
        }

        $currentStageMatches = MatchGame::where('game_id', $match->game_id)
            ->where('stage', $match->stage)
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();
        $matchIndex = $currentStageMatches->search(fn ($m) => (int) $m->id === (int) $match->id);
        if ($matchIndex === false) {
            return;
        }
        $slot = ($matchIndex % 2 === 0) ? 'team1_id' : 'team2_id';

        $team1Id = $slot === 'team1_id' ? $winnerId : $nextMatch->team1_id;
        $team2Id = $slot === 'team2_id' ? $winnerId : $nextMatch->team2_id;

        $nextMatch->update([
            'team1_id' => $team1Id,
            'team2_id' => $team2Id,
            'winner_id' => null,
            'team1_score' => 0,
            'team2_score' => 0,
            'end_time' => null,
            'status' => ($team1Id && $team2Id) ? 'pending' : 'cancelled',
        ]);
    }

    private function rebuildNextRoundsForGame(int $gameId): void
    {
        // Идем от ранних стадий к поздним и переносим победителей в следующий раунд.
        foreach (self::STAGE_ORDER as $stage) {
            if ($stage === 'final') {
                continue;
            }

            $matches = MatchGame::where('game_id', $gameId)
                ->where('stage', $stage)
                ->orderBy('start_time')
                ->orderBy('id')
                ->get();

            foreach ($matches as $match) {
                if ($match->winner_id) {
                    $this->pushWinnerToNextMatch($match, (int) $match->winner_id);
                }
            }
        }
    }

    private function settleBetsForMatch(int $matchId): void
    {
        $bets = Bet::with(['user', 'match'])->where('match_id', $matchId)->get();
        foreach ($bets as $bet) {
            if (!in_array($bet->status, ['active', 'pending'])) {
                continue;
            }
            $beforeStatus = $bet->status;
            $bet->calculateResult();
            $bet->refresh();

            if ($beforeStatus !== 'won' && $bet->status === 'won' && $bet->actual_win > 0) {
                $bet->user->increment('balance', (int) $bet->actual_win);
                $bet->user->balanceHistories()->create([
                    'amount' => (int) $bet->actual_win,
                    'type' => 'bet_win',
                    'related_bet_id' => $bet->id,
                ]);
            }
        }
    }

    private function removeTeamFromOpenMatches(int $teamId, int $gameId): void
    {
        $matches = MatchGame::where('game_id', $gameId)
            ->whereIn('status', ['pending', 'scheduled', 'cancelled'])
            ->where(function ($q) use ($teamId) {
                $q->where('team1_id', $teamId)->orWhere('team2_id', $teamId);
            })
            ->get();

        foreach ($matches as $match) {
            $update = [
                'winner_id' => null,
                'team1_score' => 0,
                'team2_score' => 0,
                'end_time' => null,
                'status' => 'cancelled',
            ];

            if ((int) $match->team1_id === $teamId) {
                $update['team1_id'] = null;
            }
            if ((int) $match->team2_id === $teamId) {
                $update['team2_id'] = null;
            }

            $match->update($update);
        }

        $this->rebuildNextRoundsForGame($gameId);
    }
    
}