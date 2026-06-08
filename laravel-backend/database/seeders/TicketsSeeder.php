<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TicketsSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание билетов...\n";

        $users = User::where('role', 'user')->get();
        
        $ticketTypes = ['standard', 'vip', 'premium', 'standard', 'standard']; // больше стандартных
        
        // Билеты для администраторов и организаторов (бесплатные)
        // Используем только существующие роли: admin и organizer
        $organizerEmails = ['admin@festival.local', 'organizer@festival.local'];
        $organizerTickets = User::whereIn('email', $organizerEmails)->get();
        
        foreach ($organizerTickets as $index => $organizer) {
            $type = $index === 0 ? 'premium' : 'vip';
            Ticket::create([
                'user_id' => $organizer->id,
                'ticket_number' => 'STAFF-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT),
                'type' => $type,
                'price' => 0,
                'payment_status' => 'paid',
                'payment_method' => 'internal',
                'payment_date' => now()->subDays(40),
                'activated_at' => now()->subDays(30),
                'expires_at' => now()->addDays(10),
                'qr_code' => 'QR-STAFF-' . Str::random(20),
                'qr_code_hash' => hash('sha256', 'STAFF-' . ($index + 1)),
                'created_at' => now()->subDays(40),
            ]);
        }
        
        // Билеты для обычных пользователей (20 человек купили билеты)
        $ticketBuyers = $users->take(20);
        
        $prices = [
            'standard' => 1500,
            'vip' => 3500,
            'premium' => 5000,
        ];
        
        $paymentDates = [
            now()->subDays(35), now()->subDays(32), now()->subDays(30), now()->subDays(28),
            now()->subDays(25), now()->subDays(22), now()->subDays(20), now()->subDays(18),
            now()->subDays(15), now()->subDays(14), now()->subDays(12), now()->subDays(10),
            now()->subDays(8), now()->subDays(7), now()->subDays(5), now()->subDays(4),
            now()->subDays(3), now()->subDays(2), now()->subDays(1), now(),
        ];
        
        foreach ($ticketBuyers as $index => $user) {
            $type = $ticketTypes[$index % count($ticketTypes)];
            $price = $prices[$type];
            $paymentDate = $paymentDates[$index % count($paymentDates)];
            
            Ticket::create([
                'user_id' => $user->id,
                'ticket_number' => 'TICKET-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'type' => $type,
                'price' => $price,
                'payment_status' => 'paid',
                'payment_method' => 'bank_card',
                'payment_date' => $paymentDate,
                'activated_at' => $paymentDate->copy()->addDays(rand(1, 3)),
                'expires_at' => now()->addDays(10),
                'qr_code' => 'QR-' . Str::random(20),
                'qr_code_hash' => hash('sha256', 'TICKET-' . ($index + 1)),
                'created_at' => $paymentDate,
            ]);
        }
    }
}