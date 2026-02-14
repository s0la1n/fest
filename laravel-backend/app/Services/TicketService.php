<?php

namespace App\Services;

use App\Models\User;
use App\Models\Ticket;
use App\Mail\TicketPurchaseMail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;

class TicketService
{
    private const TICKET_PRICES = [
        'standard' => 1000,
        'vip' => 2500,
        'premium' => 5000,
        'cosplay' => 1500,
        'tournament' => 2000,
    ];

    private const TICKET_BENEFITS = [
        'standard' => ['entry', 'basic_merch_discount'],
        'vip' => ['entry', 'vip_lounge', 'fast_track', 'merch_discount', 'drink_voucher'],
        'premium' => ['entry', 'vip_lounge', 'fast_track', 'premium_merch_discount', 'meet_and_greet', 'backstage_access'],
    ];

    /** Начальный баланс (монеты) по типу билета после оплаты */
    private const INITIAL_BALANCE_BY_TICKET = [
        'standard' => 400,
        'vip' => 800,
        'premium' => 1500,
        'cosplay' => 500,
        'tournament' => 500,
    ];

    public function buyTicket(array $validated): array
    {
        $user = User::where('email', $validated['email'])->first();
        if ($user) {
            return ['message' => 'Пользователь с таким email уже существует. Войдите в свой аккаунт.', 'status' => 409];
        }

        $user = User::where('phone', $validated['phone'])->first();
        if ($user) {
            return ['message' => 'Пользователь с таким номером телефона уже существует. Войдите в свой аккаунт.', 'status' => 409];
        }

        $login = $this->generateLogin($validated['email']);
        $password = Str::random(10);

        $user = User::create([
            'login' => $login,
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'name' => $validated['name'],
            'last_name' => $validated['last_name'] ?? null,
            'nickname' => $validated['name'] ?? null,
            'password' => bcrypt($password),
            'role' => 'user',
            'is_banned' => false,
        ]);

        $ticketType = $validated['ticket_type'];

        $ticket = $this->createPendingTicket($user, $ticketType);
        Cache::put('ticket_temp_password:' . $ticket->id, $password, now()->addHours(24));

        $payment = $this->createYooKassaPayment($ticket);

        if (!$payment || empty($payment['confirmation_url'])) {
            Log::error('YooKassa: failed to create payment', ['ticket_id' => $ticket->id]);
            return ['message' => 'Не удалось создать платёж. Проверьте настройки ЮKassa.', 'status' => 502];
        }

        $ticket->update(['transaction_id' => $payment['id']]);

        return [
            'success' => true,
            'confirmation_url' => $payment['confirmation_url'],
            'ticket_id' => $ticket->id,
            'message' => 'Перейдите по ссылке для оплаты.',
            'status' => 201,
        ];
    }

    public function confirmPayment(int $ticketId): array
    {
        $ticket = Ticket::find($ticketId);
        if (!$ticket) {
            return ['message' => 'Билет не найден', 'status' => 404];
        }

        if ($ticket->payment_status === 'paid') {
            return ['success' => true, 'message' => 'Билет уже оплачен.', 'ticket' => $ticket];
        }

        if (!$ticket->transaction_id) {
            return ['message' => 'Нет привязки к платежу', 'status' => 400];
        }

        $paymentStatus = $this->getYooKassaPaymentStatus($ticket->transaction_id);

        if ($paymentStatus === null) {
            Log::warning('YooKassa: не удалось получить статус платежа', ['transaction_id' => $ticket->transaction_id]);
            return [
                'success' => false,
                'message' => 'Временная ошибка при проверке платежа. Нажмите «Проверить снова» через минуту.',
                'status' => 502,
            ];
        }

        if (!in_array($paymentStatus, ['succeeded', 'pending'], true)) {
            return [
                'success' => false,
                'message' => 'Оплата не найдена или ещё не проведена. Статус: ' . $paymentStatus,
                'status' => 400,
                'status_field' => $paymentStatus,
            ];
        }

        $ticket->update([
            'payment_status' => 'paid',
            'payment_date' => now(),
            'payment_method' => 'yookassa',
            'activated_at' => now(),
        ]);

        $user = $ticket->user;
        $initialBalance = self::INITIAL_BALANCE_BY_TICKET[$ticket->type] ?? 400;
        $user->increment('balance', $initialBalance);
        $user->balanceHistories()->create([
            'amount' => $initialBalance,
            'type' => 'registration_bonus',
        ]);

        $password = Cache::pull('ticket_temp_password:' . $ticket->id);
        $emailSent = $password ? $this->sendTicketEmail($user, $password, $ticket) : false;

        $payload = [
            'success' => true,
            'message' => $emailSent
                ? 'Оплата подтверждена. Данные для входа отправлены на вашу почту.'
                : 'Оплата подтверждена. Письмо не удалось отправить — сохраните данные для входа ниже.',
            'ticket' => $ticket,
        ];
        if (!$emailSent && $password) {
            $payload['login'] = $user->login;
            $payload['password'] = $password;
        }
        return $payload;
    }

    private function createPendingTicket(User $user, string $ticketType): Ticket
    {
        $price = self::TICKET_PRICES[$ticketType] ?? 1000;
        $ticketNumber = 'TICKET-' . strtoupper(Str::random(6)) . '-' . $user->id;

        return Ticket::create([
            'user_id' => $user->id,
            'ticket_number' => $ticketNumber,
            'type' => $ticketType,
            'price' => $price,
            'payment_status' => 'pending',
            'transaction_id' => null,
            'payment_method' => null,
            'payment_date' => null,
            'activated_at' => null,
            'expires_at' => now()->addDays(30),
            'qr_code' => 'QR-' . Str::random(20),
            'qr_code_hash' => hash('sha256', $ticketNumber),
        ]);
    }

    private function getYooKassaConfig(): ?array
    {
        $shopId = config('yookassa.shop_id');
        $secretKey = config('yookassa.secret_key');
        if (!$shopId || !$secretKey) {
            Log::warning('YooKassa: YUKASSA_SHOP_ID or YUKASSA_SECRET_KEY not set');
            return null;
        }
        return [
            'shop_id' => $shopId,
            'secret_key' => $secretKey,
            'api_url' => config('yookassa.api_url'),
            'timeout' => config('yookassa.timeout', 30),
            'connect_timeout' => config('yookassa.connect_timeout', 15),
        ];
    }

    private function createYooKassaPayment(Ticket $ticket): ?array
    {
        $config = $this->getYooKassaConfig();
        if (!$config) return null;

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $returnUrl = $frontendUrl . '/buy-ticket/success?ticket_id=' . $ticket->id;

        $body = [
            'amount' => ['value' => number_format((float) $ticket->price, 2, '.', ''), 'currency' => 'RUB'],
            'capture' => true,
            'confirmation' => ['type' => 'redirect', 'return_url' => $returnUrl],
            'description' => 'Билет на фестиваль. Номер: ' . $ticket->ticket_number,
            'metadata' => ['ticket_id' => (string) $ticket->id],
        ];

        $response = Http::withBasicAuth($config['shop_id'], $config['secret_key'])
            ->connectTimeout($config['connect_timeout'])
            ->timeout($config['timeout'])
            ->withHeaders(['Idempotence-Key' => 'ticket-' . $ticket->id . '-' . time()])
            ->post($config['api_url'] . '/payments', $body);

        if (!$response->successful()) {
            Log::error('YooKassa create payment failed', ['response' => $response->body(), 'ticket_id' => $ticket->id]);
            return null;
        }

        $data = $response->json();
        return [
            'id' => $data['id'] ?? null,
            'confirmation_url' => $data['confirmation']['confirmation_url'] ?? null,
        ];
    }

    private function getYooKassaPaymentStatus(string $paymentId): ?string
    {
        $config = $this->getYooKassaConfig();
        if (!$config) return null;

        $response = Http::withBasicAuth($config['shop_id'], $config['secret_key'])
            ->connectTimeout($config['connect_timeout'])
            ->timeout($config['timeout'])
            ->get($config['api_url'] . '/payments/' . $paymentId);

        if (!$response->successful()) {
            Log::warning('YooKassa GET payment failed', [
                'payment_id' => $paymentId,
                'status' => $response->status(),
            ]);
            return null;
        }

        return $response->json('status');
    }

    private function generateLogin(string $email): string
    {
        $baseLogin = explode('@', $email)[0];
        $login = $baseLogin;
        $counter = 1;

        while (User::where('login', $login)->exists()) {
            $login = $baseLogin . $counter;
            $counter++;
        }

        return $login;
    }

    private function sendTicketEmail(User $user, string $password, Ticket $ticket): bool
    {
        try {
            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            Mail::to($user->email)->send(new TicketPurchaseMail([
                'user' => $user,
                'password' => $password,
                'ticket' => $ticket,
                'login_url' => $frontendUrl . '/signin',
            ]));
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send ticket email: ' . $e->getMessage(), ['to' => $user->email]);
            return false;
        }
    }

    public static function getTicketBenefits(string $ticketType): array
    {
        return self::TICKET_BENEFITS[$ticketType] ?? ['entry'];
    }
}
