<?php

namespace App\Http\Controllers;

use App\Models\Cosplayer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VotingController extends Controller
{
    /**
     * Список участников конкурса косплея для голосования.
     */
    public function participants(Request $request): JsonResponse
    {
        $user = $request->user();
        $participants = Cosplayer::all()
            ->map(fn ($c) => [
                'id' => $c->id,
                'character_name' => $c->character_name,
                'origin' => $c->origin,
                'photo' => $c->photo_url, // используем аксессор
                'display_name' => trim($c->name . ' ' . $c->last_name) ?: 'Участник',
                'votes_count' => (int) ($c->votes_count ?? 0),
                'has_voted' => in_array($user->id, $c->voted_users ?? [], true),
            ]);
        return response()->json(['participants' => $participants]);
    }

    /**
     * Проголосовать за участника
     */
    public function vote(Request $request): JsonResponse
    {
        $request->validate(['participant_id' => 'required|integer']);
        $user = $request->user();
        $cosplayerId = (int) $request->input('participant_id');
        $cosplayer = Cosplayer::find($cosplayerId);

        if (!$cosplayer) {
            return response()->json(['message' => 'Участник не найден'], 404);
        }

        if (in_array($user->id, $cosplayer->voted_users ?? [], true)) {
            return response()->json(['message' => 'Вы уже проголосовали за этого участника'], 422);
        }

        $votedElsewhere = Cosplayer::where('id', '!=', $cosplayer->id)
            ->whereNotNull('voted_users')
            ->get()
            ->contains(fn ($c) => in_array($user->id, $c->voted_users ?? [], true));
        if ($votedElsewhere) {
            return response()->json(['message' => 'Вы уже использовали свой голос. Голосовать можно только один раз.'], 422);
        }

        $cosplayer->vote($user);
        return response()->json(['success' => true]);
    }

    /**
     * Получить всех косплееров для организатора
     */
    public function getAllCosplayers(): JsonResponse
    {
        $cosplayers = Cosplayer::orderBy('votes_count', 'desc')->get();
        
        return response()->json([
            'cosplayers' => $cosplayers->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'last_name' => $c->last_name,
                'character_name' => $c->character_name,
                'origin' => $c->origin,
                'photo' => $c->photo_url,
                'biography' => $c->biography,
                'portfolio_link' => $c->portfolio_link,
                'votes_count' => $c->votes_count,
                'created_at' => $c->created_at?->toIso8601String(),
            ])
        ]);
    }

    /**
     * Получить одного косплеера
     */
    public function getCosplayer(int $id): JsonResponse
    {
        $cosplayer = Cosplayer::findOrFail($id);
        
        return response()->json([
            'cosplayer' => [
                'id' => $cosplayer->id,
                'name' => $cosplayer->name,
                'last_name' => $cosplayer->last_name,
                'character_name' => $cosplayer->character_name,
                'origin' => $cosplayer->origin,
                'photo' => $cosplayer->photo_url,
                'biography' => $cosplayer->biography,
                'portfolio_link' => $cosplayer->portfolio_link,
                'votes_count' => $cosplayer->votes_count,
            ]
        ]);
    }

    /**
     * Создать косплеера с загрузкой фото
     */
    public function createCosplayer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'character_name' => 'required|string|max:255',
            'origin' => 'required|string|max:255',
            'biography' => 'nullable|string|max:5000',
            'photo' => 'required|image|max:5120', // сделаем обязательным для создания
            'portfolio_link' => 'nullable|string|url|max:255',
        ]);

        // Загрузка изображения
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . Str::random(40) . '.' . $file->getClientOriginalExtension();
            $photoPath = $file->storeAs('cosplayers', $filename, 'public');
        }

        if (!$photoPath) {
            return response()->json(['error' => 'Фото обязательно'], 422);
        }

        $cosplayer = Cosplayer::create([
            'name' => $validated['name'],
            'last_name' => $validated['last_name'],
            'character_name' => $validated['character_name'],
            'origin' => $validated['origin'],
            'biography' => $validated['biography'] ?? null,
            'photo' => $photoPath,
            'portfolio_link' => $validated['portfolio_link'] ?? null,
            'votes_count' => 0,
            'voted_users' => [],
        ]);

        return response()->json([
            'success' => true,
            'cosplayer' => [
                'id' => $cosplayer->id,
                'name' => $cosplayer->name,
                'last_name' => $cosplayer->last_name,
                'character_name' => $cosplayer->character_name,
                'origin' => $cosplayer->origin,
                'photo' => $cosplayer->photo_url,
                'biography' => $cosplayer->biography,
                'portfolio_link' => $cosplayer->portfolio_link,
            ],
            'message' => 'Участник добавлен'
        ], 201);
    }

    /**
     * Обновить косплеера с загрузкой фото
     */
    public function updateCosplayer(Request $request, int $id): JsonResponse
    {
        $cosplayer = Cosplayer::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'character_name' => 'sometimes|string|max:255',
            'origin' => 'sometimes|string|max:255',
            'biography' => 'nullable|string|max:5000',
            'photo' => 'nullable|image|max:5120',
            'portfolio_link' => 'nullable|string|url|max:255',
        ]);

        $data = [];
        
        if (isset($validated['name'])) $data['name'] = $validated['name'];
        if (isset($validated['last_name'])) $data['last_name'] = $validated['last_name'];
        if (isset($validated['character_name'])) $data['character_name'] = $validated['character_name'];
        if (isset($validated['origin'])) $data['origin'] = $validated['origin'];
        if (isset($validated['biography'])) $data['biography'] = $validated['biography'];
        if (isset($validated['portfolio_link'])) $data['portfolio_link'] = $validated['portfolio_link'];

        // Обновляем фото если загружено новое
        if ($request->hasFile('photo')) {
            // Удаляем старое фото
            if ($cosplayer->photo && Storage::disk('public')->exists($cosplayer->photo)) {
                Storage::disk('public')->delete($cosplayer->photo);
            }
            
            $file = $request->file('photo');
            $filename = time() . '_' . Str::random(40) . '.' . $file->getClientOriginalExtension();
            $data['photo'] = $file->storeAs('cosplayers', $filename, 'public');
        }

        $cosplayer->update($data);

        return response()->json([
            'success' => true,
            'cosplayer' => [
                'id' => $cosplayer->id,
                'name' => $cosplayer->name,
                'last_name' => $cosplayer->last_name,
                'character_name' => $cosplayer->character_name,
                'origin' => $cosplayer->origin,
                'photo' => $cosplayer->photo_url,
                'biography' => $cosplayer->biography,
                'portfolio_link' => $cosplayer->portfolio_link,
                'votes_count' => $cosplayer->votes_count,
            ],
            'message' => 'Участник обновлен'
        ]);
    }

    /**
     * Удалить косплеера
     */
    public function deleteCosplayer(int $id): JsonResponse
    {
        $cosplayer = Cosplayer::findOrFail($id);
        
        // Удаляем фото
        if ($cosplayer->photo && Storage::disk('public')->exists($cosplayer->photo)) {
            Storage::disk('public')->delete($cosplayer->photo);
        }
        
        $cosplayer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Участник удален'
        ]);
    }
}