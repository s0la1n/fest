<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class OrganizerMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($request->user()->role !== 'organizer' && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden - Organizer access required'], 403);
        }

        return $next($request);
    }
}