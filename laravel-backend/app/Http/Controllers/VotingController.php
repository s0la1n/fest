<?php

namespace App\Http\Controllers;

use App\Models\Cosplayer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
                'photo' => $c->photo,
                'display_name' => trim($c->name . ' ' . $c->last_name) ?: 'Участник',
                'votes_count' => (int) ($c->votes_count ?? 0),
                'has_voted' => in_array($user->id, $c->voted_users ?? [], true),
            ]);
        return response()->json(['participants' => $participants]);
    }

    /**
     * Проголосовать за участника (один голос на пользователя).
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
}
