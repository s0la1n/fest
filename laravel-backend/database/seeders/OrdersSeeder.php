<?php

namespace Database\Seeders;

use App\Models\Merch;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrdersSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание заказов...\n";

        $users = User::where('role', 'user')->get();
        $merchItems = Merch::all();
        
        if ($users->isEmpty() || $merchItems->isEmpty()) {
            echo "Нет пользователей или товаров для создания заказов\n";
            return;
        }

        // Категории товаров
        $cheapItems = $merchItems->filter(fn($item) => $item->price <= 500);
        $mediumItems = $merchItems->filter(fn($item) => $item->price > 500 && $item->price <= 2500);
        $expensiveItems = $merchItems->filter(fn($item) => $item->price > 2500);

        // Активные пользователи
        $activeUserIds = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        
        foreach ($users as $user) {
            $isActive = in_array($user->id, $activeUserIds);
            $ordersCount = $isActive ? rand(2, 5) : rand(0, 2);
            
            for ($i = 0; $i < $ordersCount; $i++) {
                $merch = $this->selectMerchByUserBalance($user, $cheapItems, $mediumItems, $expensiveItems);
                if (!$merch) continue;
                
                $quantity = rand(1, 2);
                $totalAmount = $merch->price * $quantity;
                
                // Проверяем, что у пользователя был достаточный баланс на момент покупки
                // Для старых заказов баланс мог быть больше
                $userOriginalBalance = $user->balance + $totalAmount + rand(0, 500);
                if ($totalAmount > $userOriginalBalance) {
                    continue;
                }
                
                $createdAt = now()->subDays(rand(1, 25));
                $statuses = ['processing', 'confirmed', 'shipped'];
                $status = $statuses[array_rand($statuses)];
                
                if ($createdAt < now()->subDays(7)) {
                    $status = 'shipped';
                }
                
                $city = $this->getCityForUser($user->id);
                $address = $this->getAddressForCity($city);
                
                $order = Order::create([
                    'order_number' => 'ORD-' . strtoupper(Str::random(8) . $user->id . $i),
                    'user_id' => $user->id,
                    'merch_id' => $merch->id,
                    'quantity' => $quantity,
                    'total_amount' => $totalAmount,
                    'shipping_address' => $address,
                    'status' => $status,
                    'tracking_number' => $status === 'shipped' ? 'TRK-' . strtoupper(Str::random(12)) : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt->copy()->addDays(rand(1, 5)),
                ]);
                
                echo "    Заказ #{$order->order_number}: {$merch->name} x{$quantity} = {$totalAmount} монет (пользователь {$user->id})\n";
            }
        }
        
        echo "✅ Создано заказов: " . Order::count() . "\n";
    }
    
    private function selectMerchByUserBalance($user, $cheapItems, $mediumItems, $expensiveItems): ?Merch
    {
        $userId = $user->id;
        
        // Богатые пользователи (id 5, 11, 15) - чаще дорогие товары
        $richUsers = [5, 11, 15];
        
        if (in_array($userId, $richUsers) && $expensiveItems->isNotEmpty()) {
            $rand = rand(1, 100);
            if ($rand <= 70) {
                return $expensiveItems->random();
            } elseif ($rand <= 90 && $mediumItems->isNotEmpty()) {
                return $mediumItems->random();
            } elseif ($cheapItems->isNotEmpty()) {
                return $cheapItems->random();
            }
        }
        
        // Средние пользователи
        if (in_array($userId, [3, 4, 7, 8, 12, 13, 14]) && $mediumItems->isNotEmpty()) {
            $rand = rand(1, 100);
            if ($rand <= 60) {
                return $mediumItems->random();
            } elseif ($rand <= 85 && $cheapItems->isNotEmpty()) {
                return $cheapItems->random();
            } elseif ($expensiveItems->isNotEmpty()) {
                return $expensiveItems->random();
            }
        }
        
        // Остальные - дешёвые товары
        if ($cheapItems->isNotEmpty()) {
            return $cheapItems->random();
        }
        
        $allItems = Merch::all();
        return $allItems->isNotEmpty() ? $allItems->random() : null;
    }
    
    private function getCityForUser(int $userId): string
    {
        $cities = [
            1 => 'Москва', 2 => 'Санкт-Петербург', 3 => 'Москва', 4 => 'Казань',
            5 => 'Новосибирск', 6 => 'Екатеринбург', 7 => 'Москва', 8 => 'Нижний Новгород',
            9 => 'Краснодар', 10 => 'Челябинск', 11 => 'Москва', 12 => 'Санкт-Петербург',
            13 => 'Ростов-на-Дону', 14 => 'Уфа', 15 => 'Волгоград', 16 => 'Пермь',
            17 => 'Красноярск', 18 => 'Воронеж', 19 => 'Саратов', 20 => 'Тюмень',
        ];
        return $cities[$userId % count($cities) + 1] ?? 'Москва';
    }
    
    private function getAddressForCity(string $city): string
    {
        $streets = ['Ленина', 'Пушкина', 'Гагарина', 'Центральная', 'Молодёжная', 'Советская'];
        $street = $streets[array_rand($streets)];
        $house = rand(1, 100);
        $apartment = rand(1, 200);
        return "г. {$city}, ул. {$street}, д. {$house}, кв. {$apartment}";
    }
}