<?php

namespace App\Http\Controllers;

use App\Http\Requests\BuyTicketRequest;
use App\Services\TicketService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService
    ) {
    }

    /**
     * Покупка билета: создаёт пользователя и билет (pending), возвращает ссылку на оплату ЮKassa
     */
    public function buyTicket(BuyTicketRequest $request): JsonResponse
    {
        try {
            $result = $this->ticketService->buyTicket($request->validated());
        } catch (ConnectionException $e) {
            Log::error('Buy ticket YooKassa connection error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Сервер оплаты временно не отвечает. Попробуйте повторить попытку через минуту.',
            ], 504);
        } catch (\Throwable $e) {
            Log::error('Buy ticket error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Произошла ошибка при покупке билета.',
            ], 500);
        }

        $status = $result['status'] ?? 201;
        unset($result['status']);
        return response()->json($result, $status);
    }

    /**
     * Подтверждение оплаты билета после возврата с ЮKassa
     */
    public function confirmPayment(Request $request): JsonResponse
    {
        $ticketId = $request->get('ticket_id');
        if (!$ticketId) {
            return response()->json(['message' => 'Не указан ticket_id'], 400);
        }

        $result = $this->ticketService->confirmPayment((int) $ticketId);
        $status = (int) ($result['status'] ?? 200);
        unset($result['status'], $result['status_field']);

        return response()->json($result, $status);
    }
}
