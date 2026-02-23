<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\MatchGame;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    private function scheduleEventRules(): array
    {
        return [
            'short_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'start_time' => 'required|string|regex:/^\d{2}:\d{2}$/',
            'day' => 'required|integer|min:1|max:5',
        ];
    }

    /**
     * Создать событие расписания (только админ).
     */
    public function storeEvent(Request $request): JsonResponse
    {
        $validated = $request->validate($this->scheduleEventRules());
        $schedule = Schedule::create($validated);
        return response()->json([
            'message' => 'Событие добавлено',
            'schedule' => $this->formatSchedule($schedule),
        ], 201);
    }

    /**
     * Обновить событие расписания (только админ).
     */
    public function updateEvent(Request $request, Schedule $schedule): JsonResponse
    {
        $validated = $request->validate($this->scheduleEventRules());
        $schedule->update($validated);
        return response()->json([
            'message' => 'Событие обновлено',
            'schedule' => $this->formatSchedule($schedule->fresh()),
        ]);
    }

    /**
     * Удалить событие расписания (только админ).
     */
    public function destroyEvent(Schedule $schedule): JsonResponse
    {
        $schedule->delete();
        return response()->json(['message' => 'Событие удалено']);
    }

    private function formatSchedule(Schedule $s): array
    {
        return [
            'id' => $s->id,
            'short_name' => $s->short_name,
            'description' => $s->description,
            'start_time' => $s->start_time ? $s->start_time->format('H:i') : null,
            'end_time' => null,
            'day' => $s->day,
        ];
    }
    /**
     * Расписание фестиваля: события по дням и матчи.
     */
    public function index(Request $request): JsonResponse
    {
        $days = ['2026-03-29', '2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02'];

        $games = Game::orderBy('name')->get(['id', 'name', 'slug', 'description']);
        $schedules = Schedule::orderBy('day')->orderBy('start_time')->get();
        $matches = MatchGame::with(['game:id,name', 'team1:id,team_name', 'team2:id,team_name'])
            ->orderBy('start_time')
            ->get();

        $byDay = [];
        foreach ($days as $date) {
            $byDay[$date] = $matches->filter(function ($m) use ($date) {
                return $m->start_time && $m->start_time->format('Y-m-d') === $date;
            })->values()->map(fn ($m) => $this->formatMatch($m))->all();
        }

        $schedulesFormatted = $schedules->map(fn ($s) => $this->formatSchedule($s));

        return response()->json([
            'games' => $games,
            'schedules' => $schedulesFormatted,
            'matches' => $matches->map(fn ($m) => $this->formatMatch($m))->all(),
            'by_day' => $byDay,
        ]);
    }

    /**
     * Турнирная сетка по игре.
     */
    public function bracket(int $game): JsonResponse
    {
        $matches = MatchGame::with(['team1:id,team_name', 'team2:id,team_name'])
            ->where('game_id', $game)
            ->orderBy('stage')
            ->orderBy('start_time')
            ->get();

        $list = $matches->map(fn ($m) => $this->formatMatch($m))->all();

        return response()->json($list);
    }

    private function formatMatch(MatchGame $m): array
    {
        $statusMap = ['finished' => 'completed', 'scheduled' => 'upcoming'];
        $status = $statusMap[$m->status] ?? $m->status;

        $formatTeam = fn ($team) => $team ? [
            'id' => $team->id,
            'name' => $team->team_name ?? null,
            'display_name' => $team->team_name ?? "Команда #{$team->id}",
        ] : null;

        return [
            'id' => $m->id,
            'game_id' => $m->game_id,
            'team1_id' => $m->team1_id,
            'team2_id' => $m->team2_id,
            'team1' => $formatTeam($m->team1),
            'team2' => $formatTeam($m->team2),
            'stage' => $m->stage,
            'status' => $status,
            'start_time' => $m->start_time?->toIso8601String(),
            'end_time' => $m->end_time?->toIso8601String(),
            'team1_score' => $m->team1_score,
            'team2_score' => $m->team2_score,
            'winner_id' => $m->winner_id,
        ];
    }
}
