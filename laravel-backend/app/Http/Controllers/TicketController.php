<?php

namespace App\Http\Controllers;

use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Validation\ValidationException;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService
    ) {
    }

    /**
     * Покупка билета: создаёт пользователя и билет (pending), возвращает ссылку на оплату ЮKassa
     */
    public function buyTicket(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:20',
                'ticket_type' => 'required|in:standard,vip,premium,cosplay,tournament',
                'name' => 'required|string|max:255',
                'last_name' => 'nullable|string|max:255',
            ]);

            $result = $this->ticketService->buyTicket($validated);
            $status = $result['status'] ?? 201;
            unset($result['status']);

            return response()->json($result, $status);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (ConnectionException $e) {
            \Illuminate\Support\Facades\Log::error('Buy ticket YooKassa connection error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Сервер оплаты временно не отвечает. Попробуйте повторить попытку через минуту.',
            ], 504);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Buy ticket error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Произошла ошибка при покупке билета: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Подтверждение оплаты билета после возврата с ЮKassa
     */
    public function confirmPayment(Request $request)
    {
        $ticketId = $request->input('ticket_id') ?: $request->query('ticket_id');
        if (!$ticketId) {
            return response()->json(['message' => 'Не указан ticket_id'], 400);
        }

        $result = $this->ticketService->confirmPayment((int) $ticketId);

        $status = $result['status'] ?? 200;
        if ($status >= 400) {
            unset($result['status'], $result['status_field']);
            return response()->json($result, $status);
        }
        return response()->json($result);
    }
}
