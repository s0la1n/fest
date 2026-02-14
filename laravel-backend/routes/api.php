<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BalanceController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\VotingController;

// Публичные маршруты
Route::get('/schedule', [ScheduleController::class, 'index']);
Route::get('/schedule/bracket/{game}', [ScheduleController::class, 'bracket']);

Route::get('/applications/games', function () {
    $urls = ['cs2' => 'https://www.counter-strike.net', 'dota2' => 'https://www.dota2.com', 'valorant' => 'https://playvalorant.com'];
    $games = \App\Models\Game::orderBy('name')->get(['id', 'name', 'slug', 'description']);
    return response()->json($games->map(fn ($g) => [...$g->toArray(), 'official_url' => $urls[$g->slug ?? ''] ?? null]));
});

Route::get('/teams/{gameId}', fn ($gameId) => response()->json(
    \App\Models\Team::with(['tournamentApplication:id,game_id,team_name,tag', 'players.user:id,nickname,login'])
        ->whereHas('tournamentApplication', fn ($q) => $q->where('game_id', $gameId)->where('status', 'approved'))
        ->get()
));

Route::get('/test', function () {
    return response()->json(['message' => 'API работает!']);
});

Route::get('/test-cors', function() {
    return response()->json(['message' => 'CORS is working!']);
});

// Покупка билета: создаёт пользователя и билет (pending), возвращает ссылку на оплату ЮKassa
Route::post('/buy-ticket', [TicketController::class, 'buyTicket']);
// Подтверждение оплаты после возврата с ЮKassa (ticket_id в query или body)
Route::get('/buy-ticket/confirm', [TicketController::class, 'confirmPayment']);
Route::post('/buy-ticket/confirm', [TicketController::class, 'confirmPayment']);

// Вход в существующий аккаунт
Route::post('/login', [AuthController::class, 'login']);

// Проверки
Route::post('/check-email', [AuthController::class, 'checkEmail']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Защищенные маршруты
Route::middleware(['auth:sanctum'])->group(function () {
    // Аутентификация
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/auth/check', fn () => response()->json(['authenticated' => true]));
    
    // Профиль пользователя
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/change-password', [AuthController::class, 'changePassword']);
    
    // Билеты пользователя
    Route::get('/my-tickets', [AuthController::class, 'getUserTickets']);
    Route::get('/check-active-ticket', [AuthController::class, 'checkActiveTicket']);
    
    Route::get('/balance', [BalanceController::class, 'index']);
    Route::get('/balance/history', [BalanceController::class, 'history']);

    Route::get('/shop', [ShopController::class, 'index']);
    Route::post('/shop/purchase', [ShopController::class, 'purchase']);
    Route::get('/my-orders', [ShopController::class, 'myOrders']);

    Route::get('/voting/participants', [VotingController::class, 'participants']);
    Route::post('/voting/vote', [VotingController::class, 'vote']);

    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('/organizer-actions', fn () => response()->json(['actions' => []]));
        Route::get('/users', [AuthController::class, 'getAllUsers']);
        Route::put('/users/{id}/role', [AuthController::class, 'updateUserRole']);
        Route::get('/statistics', [AdminController::class, 'statistics']);
        Route::get('/stats', [AdminController::class, 'statistics']);
        Route::post('/schedule/events', [ScheduleController::class, 'storeEvent']);
        Route::put('/schedule/events/{schedule}', [ScheduleController::class, 'updateEvent']);
        Route::delete('/schedule/events/{schedule}', [ScheduleController::class, 'destroyEvent']);
    });

    Route::prefix('organizer/tournament')->middleware(['auth:sanctum'])->group(function () {
        Route::get('/applications', fn () => response()->json(\App\Models\TournamentApplication::with('game:id,name')->orderByDesc('created_at')->get()));
        Route::get('/teams', fn () => response()->json(['teams' => \App\Models\Team::with('tournamentApplication:id,team_name,tag')->get()]));
    });

    Route::prefix('organizer/cosplay')->middleware(['auth:sanctum'])->group(function () {
        Route::get('/applications', fn () => response()->json(['data' => \App\Models\CosplayApplication::orderByDesc('created_at')->get()]));
        Route::get('/participants', fn () => response()->json(['participants' => \App\Models\CosplayApplication::where('status', 'approved')->with('user:id,name')->get()]));
    });
});

// Fallback для API
Route::fallback(function () {
    return response()->json([
        'message' => 'API endpoint not found',
        'status' => 404,
    ], 404);
});