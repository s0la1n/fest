<?php

namespace App\Http\Controllers;

use App\Models\LoginAttempt;
use App\Models\User;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{

    /**
     * Вход пользователя с защитой от брутфорса
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $login = $request->login;
        $ip = $request->ip();

        // Проверяем, не заблокирован ли вход
        if (LoginAttempt::isLocked($login, $ip)) {
            $lockedUntil = LoginAttempt::getLockedUntil($login, $ip);
            $minutesLeft = ceil(now()->diffInMinutes($lockedUntil));
            
            return response()->json([
                'message' => "Слишком много неудачных попыток. Вход заблокирован на {$minutesLeft} минут",
                'locked' => true,
                'locked_until' => $lockedUntil,
                'can_reset' => true
            ], 429);
        }

        // Ищем пользователя по логину или email
        $user = User::where('login', $login)
            ->orWhere('email', $login)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Увеличиваем счетчик неудачных попыток
            $attempt = $this->incrementLoginAttempts($login, $ip);
            
            $remainingAttempts = max(0, LoginAttempt::MAX_ATTEMPTS - $attempt->attempts);
            
            if ($remainingAttempts > 0) {
                throw ValidationException::withMessages([
                    'login' => "Неверный логин или пароль. Осталось попыток: {$remainingAttempts}",
                ]);
            } else {
                return response()->json([
                    'message' => "Слишком много неудачных попыток. Вход заблокирован на " . LoginAttempt::LOCKOUT_MINUTES . " минут",
                    'locked' => true,
                    'locked_until' => $attempt->locked_until,
                    'can_reset' => true
                ], 429);
            }
        }

        // Проверяем, не забанен ли пользователь
        if ($user->is_banned) {
            throw ValidationException::withMessages([
                'login' => ['Ваш аккаунт заблокирован. Обратитесь к администратору.'],
            ]);
        }

        // Очищаем попытки входа после успешной авторизации
        $this->clearLoginAttempts($login, $ip);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Вход выполнен успешно'
        ]);
    }

    /**
     * Увеличение счетчика неудачных попыток
     */
    private function incrementLoginAttempts(string $login, ?string $ip): LoginAttempt
    {
        $attempt = LoginAttempt::firstOrCreate(
            ['login' => $login],
            ['ip_address' => $ip, 'attempts' => 0]
        );

        $attempt->increment('attempts');
        $attempt->ip_address = $ip;
        $attempt->save();

        if ($attempt->attempts >= LoginAttempt::MAX_ATTEMPTS) {
            $attempt->locked_until = Carbon::now()->addMinutes(LoginAttempt::LOCKOUT_MINUTES);
            $attempt->save();
        }

        return $attempt;
    }

    /**
     * Очистка попыток входа
     */
    private function clearLoginAttempts(string $login, ?string $ip): void
    {
        LoginAttempt::where('login', $login)
            ->orWhere('ip_address', $ip)
            ->delete();
    }

    /**
     * Запрос на восстановление пароля
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);

        $email = $request->email;
        $user = User::where('email', $email)->first();

        // Проверяем, не заблокирован ли пользователь
        if ($user->is_banned) {
            return response()->json([
                'message' => 'Ваш аккаунт заблокирован. Восстановление пароля невозможно.'
            ], 403);
        }

        // Генерируем токен для сброса пароля
        $token = Str::random(64);
        $hashedToken = Hash::make($token);
        
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $resetLink = $frontendUrl . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($email);

        // Сохраняем токен в БД
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => $hashedToken, 'created_at' => now()]
        );

        // Очищаем попытки входа для этого пользователя при запросе сброса пароля
        LoginAttempt::where('login', $email)->delete();
        if ($user->login) {
            LoginAttempt::where('login', $user->login)->delete();
        }

        try {
            // Отправляем email
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($email, $resetLink) {
                $message->to($email)
                    ->subject('Сброс пароля')
                    ->html("
                        <h2>Сброс пароля</h2>
                        <p>Для сброса пароля перейдите по ссылке:</p>
                        <p><a href='{$resetLink}'>Сбросить пароль</a></p>
                        <p>Ссылка действительна 60 минут.</p>
                        <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
                    ");
            });

            return response()->json([
                'message' => 'Инструкции по сбросу пароля отправлены на вашу почту'
            ]);
        } catch (\Throwable $e) {
            // В режиме разработки возвращаем ссылку
            if (app()->environment('local')) {
                return response()->json([
                    'message' => 'Ссылка для сброса пароля (режим разработки)',
                    'reset_link' => $resetLink
                ]);
            }
            
            return response()->json([
                'message' => 'Произошла ошибка при отправке письма. Попробуйте позже.'
            ], 500);
        }
    }

    /**
     * Сброс пароля по токену
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$record || !Hash::check($validated['token'], $record->token)) {
            throw ValidationException::withMessages([
                'token' => ['Недействительная ссылка для сброса пароля'],
            ]);
        }

        // Проверяем срок действия токена (60 минут)
        $createdAt = Carbon::parse($record->created_at);
        if ($createdAt->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            throw ValidationException::withMessages([
                'token' => ['Ссылка для сброса пароля истекла'],
            ]);
        }

        // Обновляем пароль
        User::where('email', $validated['email'])->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Удаляем использованный токен
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        // Очищаем все попытки входа для этого пользователя
        $user = User::where('email', $validated['email'])->first();
        LoginAttempt::where('login', $user->email)->delete();
        if ($user->login) {
            LoginAttempt::where('login', $user->login)->delete();
        }

        return response()->json([
            'message' => 'Пароль успешно изменен'
        ]);
    }

    /**
     * Проверка статуса блокировки
     */
    public function checkLockStatus(Request $request)
    {
        $request->validate([
            'login' => 'required|string'
        ]);

        $login = $request->login;
        $ip = $request->ip();

        $isLocked = LoginAttempt::isLocked($login, $ip);
        $lockedUntil = LoginAttempt::getLockedUntil($login, $ip);

        return response()->json([
            'is_locked' => $isLocked,
            'locked_until' => $lockedUntil,
            'remaining_seconds' => $lockedUntil ? max(0, now()->diffInSeconds($lockedUntil)) : 0,
            'can_reset' => $isLocked
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

    /** Бонус за заполнение профиля (только фамилия), один раз */
    private const PROFILE_COMPLETION_BONUS = 100;

    /**
     * Обновление профиля пользователя. Бонус за первое заполнение фамилии.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $hadLastName = (bool) trim((string) $user->last_name);
        $user->update($validated);
        $nowHasLastName = (bool) trim((string) $user->last_name);

        $rewardGiven = false;
        $needsBonus = (!$hadLastName && $nowHasLastName);
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

    /**
     * Получение QR-кода билета пользователя
     */
    public function getTicketQr(Request $request)
    {
        $user = $request->user();
        
        // Получаем активный оплаченный билет
        $ticket = $user->tickets()
            ->where('payment_status', 'paid')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();
        
        if (!$ticket) {
            return response()->json([
                'error' => 'У вас нет активного билета'
            ], 404);
        }
        
        // Генерируем данные для QR-кода
        $qrData = json_encode([
            'ticket_number' => $ticket->ticket_number,
            'user_id' => $user->id,
            'user_name' => trim($user->name . ' ' . $user->last_name),
            'ticket_type' => $ticket->type,
            'timestamp' => now()->toIso8601String(),
        ]);
        
        return response()->json([
            'ticket' => $ticket,
            'qr_data' => $qrData,
            'ticket_number' => $ticket->ticket_number,
            'ticket_type' => $ticket->type,
        ]);
    }
}