<?php

use Illuminate\Support\Facades\Route;

// Главная страница API
Route::get('/', function () {
    return response()->json([
        'app' => 'Festival API',
        'version' => '1.0',
        'status' => 'active',
        'docs' => '/api/docs'
    ]);
});

// CSRF cookie для SPA аутентификации
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie установлен']);
});

// Проверка здоровья API
Route::get('/health', function () {
    return response()->json(['status' => 'OK']);
});

// Все API маршруты находятся в routes/api.php
// Они автоматически префиксируются /api

// Fallback для несуществующих маршрутов
Route::fallback(function () {
    return response()->json([
        'error' => 'Route not found',
        'available_routes' => ['/', '/health', '/api/*']
    ], 404);
});