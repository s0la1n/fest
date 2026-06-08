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

    private function checkTimeConflict(int $day, string $startTime, ?int $excludeId = null): ?Schedule
    {
        $query = Schedule::where('day', $day)
            ->where('start_time', $startTime);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->first();
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $validated = $request->validate($this->scheduleEventRules());
        
        $conflict = $this->checkTimeConflict($validated['day'], $validated['start_time']);
        
        if ($conflict) {
            return response()->json([
                'message' => "Время {$validated['start_time']} уже занято событием '{$conflict->short_name}'"
            ], 422);
        }
        
        $schedule = Schedule::create($validated);
        
        return response()->json([
            'message' => 'Событие добавлено',
            'schedule' => $this->formatSchedule($schedule),
        ], 201);
    }

    public function updateEvent(Request $request, Schedule $schedule): JsonResponse
    {
        $validated = $request->validate($this->scheduleEventRules());
        
        $conflict = $this->checkTimeConflict($validated['day'], $validated['start_time'], $schedule->id);
        
        if ($conflict) {
            return response()->json([
                'message' => "Время {$validated['start_time']} уже занято событием '{$conflict->short_name}'"
            ], 422);
        }
        
        $schedule->update($validated);
        
        return response()->json([
            'message' => 'Событие обновлено',
            'schedule' => $this->formatSchedule($schedule->fresh()),
        ]);
    }

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
     * Даты фестиваля: 29, 30, 31 июля, 1, 2 августа 2026
     */
    public function index(Request $request): JsonResponse
    {
        $days = ['2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02'];

        $games = Game::orderBy('name')->get(['id', 'name', 'slug', 'description']);
        $schedules = Schedule::orderBy('day')->orderBy('start_time')->get();
        
        // Только матчи, у которых есть ОБЕ команды (не TBD vs TBD)
        $matches = MatchGame::with(['game:id,name', 'team1:id,team_name', 'team2:id,team_name'])
            ->whereNotNull('team1_id')
            ->whereNotNull('team2_id')
            ->whereIn('status', ['scheduled', 'live', 'finished'])
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

    public function bracket(int $game): JsonResponse
    {
        $matches = MatchGame::with(['team1:id,team_name', 'team2:id,team_name'])
            ->where('game_id', $game)
            ->whereIn('status', ['scheduled', 'live', 'finished'])
            ->orderBy('stage')
            ->orderBy('start_time')
            ->get();

        $list = $matches->map(fn ($m) => $this->formatMatch($m))->all();

        return response()->json($list);
    }

    private function formatMatch(MatchGame $m): array
    {
        $statusMap = ['finished' => 'completed', 'scheduled' => 'upcoming', 'live' => 'live'];
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