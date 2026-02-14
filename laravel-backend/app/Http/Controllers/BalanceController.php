<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BalanceController extends Controller
{
    /**
     * Текущий баланс пользователя.
     */
    public function index(Request $request): JsonResponse
    {
        $balance = (int) ($request->user()->balance ?? 0);
        return response()->json(['balance' => $balance]);
    }

    /**
     * История операций по балансу.
     */
    public function history(Request $request): JsonResponse
    {
        $history = $request->user()
            ->balanceHistories()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'amount', 'type', 'created_at']);
        return response()->json(['history' => $history]);
    }
}
