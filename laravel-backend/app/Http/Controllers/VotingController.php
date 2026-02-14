<?php

namespace App\Http\Controllers;

use App\Models\CosplayApplication;
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
        $participants = CosplayApplication::where('status', 'approved')
            ->with(['user:id,name,nickname', 'cosplayer:id,cosplay_application_id,votes_count,voted_users'])
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'character_name' => $a->character_name,
                'origin' => $a->origin,
                'photo' => $a->photo,
                'user' => $a->user ? ['name' => $a->user->name, 'nickname' => $a->user->nickname] : null,
                'votes_count' => (int) ($a->cosplayer?->votes_count ?? 0),
                'has_voted' => in_array($user->id, $a->cosplayer?->voted_users ?? [], true),
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
        $applicationId = (int) $request->input('participant_id');
        $application = CosplayApplication::where('id', $applicationId)->where('status', 'approved')->first();

        if (!$application) {
            return response()->json(['message' => 'Участник не найден'], 404);
        }

        $cosplayer = $application->cosplayer;
        if (!$cosplayer) {
            $cosplayer = Cosplayer::create([
                'cosplay_application_id' => $application->id,
                'user_id' => $application->user_id,
                'votes_count' => 0,
                'voted_users' => [],
            ]);
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
