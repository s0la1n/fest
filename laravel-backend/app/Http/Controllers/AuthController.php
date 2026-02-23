<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Вход пользователя
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('login', $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Неверный логин или пароль.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Login successful'
        ]);
    }

    /**
     * Выход пользователя
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Получение текущего пользователя (с балансом)
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $user->balance = (int) ($user->balance ?? 0);
        return response()->json([
            'user' => $user,
        ]);
    }

    /** Бонус за заполнение профиля (фамилия и/или никнейм), один раз */
    private const PROFILE_COMPLETION_BONUS = 100;

    /**
     * Обновление профиля пользователя. Бонус за первое заполнение фамилии/никнейма.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'nickname' => 'nullable|string|max:255|unique:users,nickname,' . $user->id,
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $hadLastName = (bool) trim((string) $user->last_name);
        $hadNickname = (bool) trim((string) $user->nickname);
        $user->update($validated);
        $nowHasLastName = (bool) trim((string) $user->last_name);
        $nowHasNickname = (bool) trim((string) $user->nickname);

        $rewardGiven = false;
        $needsBonus = (!$hadLastName && $nowHasLastName) || (!$hadNickname && $nowHasNickname);
        if ($needsBonus && !$user->balanceHistories()->where('type', 'profile_completion')->exists()) {
            $user->increment('balance', self::PROFILE_COMPLETION_BONUS);
            $user->balanceHistories()->create(['amount' => self::PROFILE_COMPLETION_BONUS, 'type' => 'profile_completion']);
            $rewardGiven = true;
        }

        $user = $user->fresh();
        $user->balance = (int) ($user->balance ?? 0);
        return response()->json([
            'user' => $user,
            'message' => 'Profile updated successfully',
            'profile_bonus_granted' => $rewardGiven,
            'profile_bonus_amount' => $rewardGiven ? self::PROFILE_COMPLETION_BONUS : 0,
        ]);
    }

    /**
     * Смена пароля
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Неверный текущий пароль.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Пароль успешно изменён'
        ]);
    }

    /**
     * Запрос на восстановление пароля: создаём токен и отправляем ссылку на почту (если настроена).
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);
        $email = $request->email;
        $token = Str::random(64);
        $hashedToken = Hash::make($token);
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $resetLink = $frontendUrl . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($email);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => $hashedToken, 'created_at' => now()]
        );

        try {
            \Illuminate\Support\Facades\Mail::raw(
                "Здравствуйте!\n\nПерейдите по ссылке для сброса пароля:\n{$resetLink}\n\nСсылка действительна 60 минут.\n\nЕсли вы не запрашивали сброс пароля, проигнорируйте это письмо.",
                function ($message) use ($email) {
                    $message->to($email)->subject('Сброс пароля — Фестиваль');
                }
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'На вашу почту отправлена ссылка для сброса пароля (если почта настроена).',
                'reset_link' => $resetLink,
            ]);
        }

        return response()->json(['message' => 'На вашу почту отправлена ссылка для сброса пароля.']);
    }

    /**
     * Сброс пароля по токену из письма.
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();
        if (!$record || !Hash::check($validated['token'], $record->token)) {
            throw ValidationException::withMessages([
                'token' => ['Ссылка для сброса пароля недействительна или истекла. Запросите новую.'],
            ]);
        }

        $createdAt = $record->created_at ? \Carbon\Carbon::parse($record->created_at) : null;
        if ($createdAt && $createdAt->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            throw ValidationException::withMessages([
                'token' => ['Ссылка для сброса пароля истекла. Запросите новую.'],
            ]);
        }

        User::where('email', $validated['email'])->update([
            'password' => Hash::make($validated['password']),
        ]);
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json(['message' => 'Пароль успешно изменён. Войдите с новым паролем.']);
    }

    /**
     * Проверка существования email
     */
    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $exists = User::where('email', $request->email)->exists();

        return response()->json([
            'exists' => $exists,
            'message' => $exists ? 'Email already registered' : 'Email available'
        ]);
    }

    /**
     * Получение билетов пользователя
     */
    public function getUserTickets(Request $request)
    {
        $tickets = $request->user()->tickets()->orderByDesc('created_at')->get();
        return response()->json(['tickets' => $tickets]);
    }

    /**
     * Список всех пользователей (админ)
     */
    public function getAllUsers()
    {
        return response()->json(User::withCount('tickets')->orderByDesc('created_at')->get());
    }

    /**
     * Изменение роли пользователя (админ)
     */
    public function updateUserRole(Request $request, int $id)
    {
        $request->validate(['role' => 'required|in:user,cosplay_organizer,tournament_organizer,admin']);
        $user = User::findOrFail($id);
        $user->update(['role' => $request->role]);
        return response()->json(['user' => $user, 'message' => 'Роль обновлена']);
    }

    /**
     * Проверка активного билета
     */
    public function checkActiveTicket(Request $request)
    {
        $activeTicket = $request->user()->tickets()->active()->first();
        return response()->json(['has_active_ticket' => (bool) $activeTicket, 'ticket' => $activeTicket]);
    }
}