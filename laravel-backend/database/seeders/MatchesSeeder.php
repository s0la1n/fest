<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\MatchGame;
use App\Models\Team;
use Illuminate\Database\Seeder;

class MatchesSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание турнирной сетки (2/4/8 + BYE)...\n";

        $games = Game::all();

        foreach ($games as $game) {
            echo "\n  Игра: {$game->name}\n";

            $teams = Team::where('game_id', $game->id)
                ->where('status', 'active')
                ->orderBy('id')
                ->get();

            $teamCount = $teams->count();

            if ($teamCount < 2) {
                echo "    Пропуск: нужно минимум 2 активные команды (есть {$teamCount})\n";
                continue;
            }

            if ($teamCount > 8) {
                echo "    Пропуск: поддерживается максимум 8 активных команд (есть {$teamCount})\n";
                continue;
            }

            MatchGame::where('game_id', $game->id)->delete();

            $size = $this->resolveBracketSize($teamCount);
            $rounds = (int) log($size, 2);
            $slots = array_pad($teams->pluck('id')->shuffle()->values()->all(), $size, null);

            $previousRoundMatchIds = [];
            for ($round = 1; $round <= $rounds; $round++) {
                $matchesInRound = (int) ($size / (2 ** $round));
                $teamsInRound = $matchesInRound * 2;
                $stage = $this->resolveStageByRoundSize($teamsInRound);
                $roundMatchIds = [];

                for ($i = 0; $i < $matchesInRound; $i++) {
                    $team1Id = null;
                    $team2Id = null;
                    $winnerId = null;
                    $status = MatchGame::STATUS_CANCELLED;
                    $score1 = 0;
                    $score2 = 0;
                    $endTime = null;

                    if ($round === 1) {
                        $team1Id = $slots[$i * 2] ?? null;
                        $team2Id = $slots[$i * 2 + 1] ?? null;

                        if ($team1Id && $team2Id) {
                            $status = MatchGame::STATUS_PENDING;
                        } elseif ($team1Id || $team2Id) {
                            // BYE: команда автоматически проходит дальше
                            $status = MatchGame::STATUS_FINISHED;
                            $winnerId = $team1Id ?: $team2Id;
                            $score1 = $team1Id ? 1 : 0;
                            $score2 = $team2Id ? 1 : 0;
                            $endTime = now();
                        }
                    }

                    $match = MatchGame::create([
                        'game_id' => $game->id,
                        'team1_id' => $team1Id,
                        'team2_id' => $team2Id,
                        'winner_id' => $winnerId,
                        'match_code' => sprintf('M-%d-%d-%d', $game->id, $round, $i + 1),
                        'stage' => $stage,
                        'status' => $status,
                        'start_time' => null,
                        'end_time' => $endTime,
                        'team1_score' => $score1,
                        'team2_score' => $score2,
                    ]);

                    $roundMatchIds[] = $match->id;
                }

                if ($round > 1) {
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
                            $update['status'] = MatchGame::STATUS_PENDING;
                        } elseif ($leftWinner || $rightWinner) {
                            $update['status'] = MatchGame::STATUS_FINISHED;
                            $update['winner_id'] = $leftWinner ?: $rightWinner;
                            $update['team1_score'] = $leftWinner ? 1 : 0;
                            $update['team2_score'] = $rightWinner ? 1 : 0;
                            $update['end_time'] = now();
                        } else {
                            $update['status'] = MatchGame::STATUS_CANCELLED;
                        }

                        $nextMatch->update($update);
                    }
                }

                $previousRoundMatchIds = $roundMatchIds;
            }

            echo "    Сетка создана: команд {$teamCount}, размер {$size}\n";
        }
    }

    private function resolveBracketSize(int $teamCount): int
    {
        $size = 2;
        while ($size < $teamCount) {
            $size *= 2;
        }

        return min($size, 8);
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
}