<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Game;
use App\Models\Ticket;
use App\Models\Team;
use App\Models\TeamPlayer;
use App\Models\TournamentApplication;
use App\Models\CosplayApplication;
use App\Models\Cosplayer;
use App\Models\MatchGame;
use App\Models\Merch;
use App\Models\Order;
use App\Models\Bet;
use App\Models\TeamInvation;
use App\Models\BalanceHistory;
use App\Models\Schedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        echo "Начало заполнения базы данных...\n";

        // ========== 1. ПОЛЬЗОВАТЕЛИ ==========
        echo "Создание пользователей...\n";

        // Администратор
        $admin = User::create([
            'name' => 'Александр',
            'last_name' => 'Администраторов',
            'nickname' => 'fest_admin',
            'login' => 'admin',
            'email' => 'admin@festival.local',
            'phone' => '+79991234567',
            'email_verified_at' => now(),
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_banned' => false,
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Организатор косплея
        $cosplayOrg = User::create([
            'name' => 'Екатерина',
            'last_name' => 'Косплейная',
            'nickname' => 'cosplay_queen',
            'login' => 'cosplay_org',
            'email' => 'cosplay@festival.local',
            'phone' => '+79995556677',
            'email_verified_at' => now(),
            'password' => Hash::make('cosplay123'),
            'role' => 'cosplay_organizer',
            'is_banned' => false,
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Организатор турнира
        $tournamentOrg = User::create([
            'name' => 'Дмитрий',
            'last_name' => 'Турнирный',
            'nickname' => 'tournament_master',
            'login' => 'tournament_org',
            'email' => 'tournament@festival.local',
            'phone' => '+79998889900',
            'email_verified_at' => now(),
            'password' => Hash::make('tournament123'),
            'role' => 'tournament_organizer',
            'is_banned' => false,
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Обычные пользователи (15 человек — для 3 команд по 5 участников)
        $users = [];
        $userNames = [
            ['Иван', 'Иванов', 'ivan_fest'],
            ['Мария', 'Петрова', 'mary_gamer'],
            ['Сергей', 'Сидоров', 'sergey_pro'],
            ['Анна', 'Смирнова', 'anna_cosplay'],
            ['Алексей', 'Кузнецов', 'alex_winner'],
            ['Дмитрий', 'Попов', 'dima_esports'],
            ['Ольга', 'Соколова', 'olga_frag'],
            ['Николай', 'Лебедев', 'kolya_aim'],
            ['Елена', 'Козлова', 'lena_cosplay'],
            ['Павел', 'Новиков', 'pavel_pro'],
            ['Татьяна', 'Морозова', 'tanya_gamer'],
            ['Михаил', 'Волков', 'misha_carry'],
            ['Юлия', 'Зайцева', 'yulia_support'],
            ['Андрей', 'Павлов', 'andrey_mid'],
            ['Катерина', 'Семёнова', 'kate_offlane'],
        ];

        foreach ($userNames as $index => $nameData) {
            $user = User::create([
                'name' => $nameData[0],
                'last_name' => $nameData[1],
                'nickname' => $nameData[2],
                'login' => 'user' . ($index + 1),
                'email' => 'user' . ($index + 1) . '@festival.local',
                'phone' => '+7999' . (1000000 + $index),
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'role' => 'user',
                'is_banned' => false,
                'remember_token' => Str::random(10),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $users[] = $user;
        }

        // ========== 2. ИГРЫ (3 игры) ==========
        echo "Создание игр...\n";

        $games = [
            ['name' => 'Dota 2', 'slug' => 'dota-2', 'icon_path' => '/games/dota2.png', 'description' => 'Многопользовательская онлайн-баталия', 'max_players' => 5],
            ['name' => 'Counter-Strike 2', 'slug' => 'cs2', 'icon_path' => '/games/cs2.png', 'description' => 'Тактический шутер от первого лица', 'max_players' => 5],
            ['name' => 'Valorant', 'slug' => 'valorant', 'icon_path' => '/games/valorant.png', 'description' => 'Тактический шутер с уникальными способностями', 'max_players' => 5],
        ];

        $gameModels = [];
        foreach ($games as $game) {
            $gameModel = Game::create($game);
            $gameModels[] = $gameModel;
        }

        // ========== 3. БИЛЕТЫ ==========
        echo "Создание билетов...\n";

        $ticketTypes = ['standard', 'vip', 'premium'];
        $ticketPrices = [1500, 3500, 5000];

        foreach ($users as $index => $user) {
            $ticketType = $ticketTypes[$index % count($ticketTypes)];
            $ticketNumber = 'TICKET-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT);
            $price = $ticketPrices[$index % count($ticketPrices)];
            
            Ticket::create([
                'user_id' => $user->id,
                'ticket_number' => $ticketNumber,
                'type' => $ticketType,
                'price' => $price,
                'payment_status' => 'paid',
                'payment_method' => 'bank_card',
                'payment_date' => now()->subDays(rand(1, 30)),
                'activated_at' => now()->subDays(rand(1, 10)),
                'expires_at' => now()->addDays(30),
                'qr_code' => 'QR-' . Str::random(20),
                'qr_code_hash' => hash('sha256', $ticketNumber),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Билет для админа
        Ticket::create([
            'user_id' => $admin->id,
            'ticket_number' => 'ADMIN-001',
            'type' => 'premium',
            'price' => 0,
            'payment_status' => 'paid',
            'payment_method' => 'internal',
            'payment_date' => now(),
            'activated_at' => now(),
            'expires_at' => now()->addDays(365),
            'qr_code' => 'QR-ADMIN-' . Str::random(15),
            'qr_code_hash' => hash('sha256', 'ADMIN-001'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ========== 4. ЗАЯВКИ НА КОСПЛЕЙ ==========
        echo "Создание заявок на косплей...\n";

        $cosplayCharacters = [
            ['Электро', 'Marvel'],
            ['Геральт из Ривии', 'Ведьмак'],
            ['Элли', 'The Last of Us'],
            ['Джокер', 'Batman'],
            ['Алая Ведьма', 'Marvel'],
        ];

        $cosplayApplications = [];
        foreach ($users as $index => $user) {
            if ($index >= 5) break; // Только 5 заявок
            
            $character = $cosplayCharacters[$index];
            $status = $index === 0 ? 'approved' : ($index === 1 ? 'rejected' : 'under_review');
            
            $app = CosplayApplication::create([
                'user_id' => $user->id,
                'character_name' => $character[0],
                'origin' => $character[1],
                'photo' => '/cosplay/photos/' . Str::slug($character[0]) . '.jpg',
                'biography' => 'Опытный косплеер с 5-летним стажем',
                'character_description' => 'Детальная проработка костюма и характера персонажа',
                'portfolio_link' => 'https://portfolio.example.com/' . $user->login,
                'awards' => 'Победитель регионального конкурса 2023',
                'status' => $status,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $cosplayApplications[] = $app;

            // Создаем запись в таблице косплееров для одобренных заявок
            if ($status === 'approved') {
                Cosplayer::create([
                    'cosplay_application_id' => $app->id,
                    'user_id' => $user->id,
                    'votes_count' => rand(50, 200),
                    'voted_users' => [$users[1]->id ?? 0, $users[2]->id ?? 0, $users[3]->id ?? 0],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // ========== 5. ТУРНИРНЫЕ ЗАЯВКИ ==========
        echo "Создание заявок на турнир...\n";

        $tournamentApplications = [];
        $teamNames = ['Dragon Force', 'Cyber Warriors', 'Storm Riders'];
        $cities = ['Москва', 'Санкт-Петербург', 'Новосибирск'];

        // 3 одобренные заявки (капитаны: user0, user5, user10 — по 5 участников на команду)
        for ($i = 0; $i < 3; $i++) {
            $captainIndex = $i * 5; // 0, 5, 10
            $app = TournamentApplication::create([
                'captain_id' => $users[$captainIndex]->id,
                'game_id' => $gameModels[$i]->id,
                'team_name' => $teamNames[$i],
                'tag' => strtoupper(substr($teamNames[$i], 0, 3)) . rand(100, 999),
                'city' => $cities[$i],
                'logo' => '/teams/logos/' . Str::slug($teamNames[$i]) . '.png',
                'description' => 'Профессиональная киберспортивная команда',
                'awards' => 'Чемпионы региона 2023',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $tournamentApplications[] = $app;
        }

        // ========== 6. КОМАНДЫ ==========
        echo "Создание команд...\n";

        $teams = [];
        foreach ($tournamentApplications as $index => $app) {
            if ($app->status === 'approved') {
                $team = Team::create([
                    'tournament_application_id' => $app->id,
                    'captain_id' => $app->captain_id,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $teams[] = $team;

                // 5 участников в команде: капитан + 4 игрока
                $baseIndex = $index * 5; // 0, 5, 10
                for ($j = 0; $j < 5; $j++) {
                    $userIndex = $baseIndex + $j;
                    TeamPlayer::create([
                        'team_id' => $team->id,
                        'user_id' => $users[$userIndex]->id,
                        'role' => $j === 0 ? 'captain' : 'player',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // ========== 7. МАТЧИ ==========
        echo "Создание матчей...\n";

        if (count($teams) >= 2) {
            $stages = ['group', 'quarterfinal', 'semifinal', 'final'];
            $statuses = ['scheduled', 'live', 'finished'];
            
            for ($i = 0; $i < 5; $i++) {
                $team1 = $teams[0];
                $team2 = $teams[1 % count($teams)];
                $game = $gameModels[$i % count($gameModels)];
                
                MatchGame::create([
                    'game_id' => $game->id,
                    'team1_id' => $team1->id,
                    'team2_id' => $team2->id,
                    'winner_id' => $i % 3 == 0 ? $team1->id : ($i % 3 == 1 ? $team2->id : null),
                    'match_code' => 'MATCH-' . strtoupper(Str::random(6)),
                    'stage' => $stages[$i % count($stages)],
                    'status' => $statuses[$i % count($statuses)],
                    'start_time' => now()->addHours($i * 2),
                    'end_time' => $i % 3 != 0 ? now()->addHours($i * 2 + 1) : null,
                    'duration_minutes' => $i % 3 != 0 ? 45 : null,
                    'team1_score' => rand(0, 16),
                    'team2_score' => rand(0, 16),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // ========== 8. МЕРЧ ==========
        echo "Создание мерча...\n";

        $merchItems = [
            [
                'name' => 'Футболка "Gamer"',
                'slug' => 'gamer-t-shirt',
                'description' => 'Хлопковая футболка с принтом геймера',
                'price' => 1500.00,
                'stock_quantity' => 100,
                'sold_quantity' => 25,
                'main_image' => '/merch/tshirt-gamer.jpg',
            ],
            [
                'name' => 'Толстовка "Festival 2024"',
                'slug' => 'festival-2024-hoodie',
                'description' => 'Теплая толстовка с логотипом фестиваля',
                'price' => 3000.00,
                'stock_quantity' => 50,
                'sold_quantity' => 15,
                'main_image' => '/merch/hoodie-festival.jpg',
            ],
            [
                'name' => 'Кепка "Esports"',
                'slug' => 'esports-cap',
                'description' => 'Бейсболка с вышивкой киберспорта',
                'price' => 800.00,
                'stock_quantity' => 200,
                'sold_quantity' => 40,
                'main_image' => '/merch/cap-esports.jpg',
            ],
            [
                'name' => 'Кружка "Coffee & Games"',
                'slug' => 'coffee-games-mug',
                'description' => 'Керамическая кружка для истинных геймеров',
                'price' => 600.00,
                'stock_quantity' => 150,
                'sold_quantity' => 30,
                'main_image' => '/merch/mug-coffee.jpg',
            ],
        ];

        $merchModels = [];
        foreach ($merchItems as $item) {
            $merch = Merch::create($item);
            $merchModels[] = $merch;
        }

        // ========== 9. ЗАКАЗЫ ==========
        echo "Создание заказов...\n";

        for ($i = 0; $i < 3; $i++) {
            $merch = $merchModels[$i % count($merchModels)];
            
            Order::create([
                'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                'user_id' => $users[$i]->id,
                'merch_id' => $merch->id,
                'quantity' => rand(1, 3),
                'total_amount' => $merch->price * rand(1, 3),
                'shipping_address' => 'г. ' . $cities[$i] . ', ул. Примерная, д. ' . ($i + 1),
                'status' => $i === 0 ? 'shipped' : ($i === 1 ? 'confirmed' : 'processing'),
                'tracking_number' => $i === 0 ? 'TRACK-' . Str::random(10) : null,
                'created_at' => now()->subDays(rand(1, 10)),
                'updated_at' => now()->subDays(rand(0, 5)),
            ]);
        }

        // ========== 10. СТАВКИ ==========
        echo "Создание ставок...\n";

        if (count($teams) >= 2 && MatchGame::count() > 0) {
            $match = MatchGame::first();
            
            foreach ($users as $index => $user) {
                if ($index < 3) { // Только 3 пользователя делают ставки
                    $betOn = ['team1_win', 'team2_win', 'draw'][$index % 3];
                    $coins = [100, 200, 300][$index];
                    $odds = [1.85, 2.10, 3.50][$index];
                    
                    Bet::create([
                        'user_id' => $user->id,
                        'match_id' => $match->id,
                        'bet_on' => $betOn,
                        'coins_amount' => $coins,
                        'odds' => $odds,
                        'potential_win' => (int)($coins * $odds),
                        'status' => $index === 0 ? 'won' : ($index === 1 ? 'lost' : 'pending'),
                        'actual_win' => $index === 0 ? (int)($coins * $odds) : null,
                        'created_at' => now()->subHours(rand(1, 24)),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // ========== 11. ПРИГЛАШЕНИЯ В КОМАНДЫ ==========
        echo "Создание приглашений в команды...\n";

        // Команда 0 (users 0-4) приглашает users 5 и 6 (не из своей команды)
        if (count($teams) > 0) {
            $team = $teams[0];
            TeamInvation::create([
                'invited_by' => $team->captain_id,
                'team_id' => $team->id,
                'invited_user_id' => $users[5]->id,
                'status' => 'pending',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(1),
            ]);
            TeamInvation::create([
                'invited_by' => $team->captain_id,
                'team_id' => $team->id,
                'invited_user_id' => $users[6]->id,
                'status' => 'accepted',
                'created_at' => now()->subDays(1),
                'updated_at' => now(),
            ]);
        }

        // ========== 12. ИСТОРИЯ БАЛАНСА ==========
        echo "Создание истории баланса...\n";

        $balanceTypes = [
            'registration_bonus',
            'profile_completion', 
            'daily_login',
            'tournament_win',
            'bet_win',
            'merch_purchase',
        ];

        foreach ($users as $index => $user) {
            for ($j = 0; $j < 3; $j++) {
                $amount = $j === 0 ? 500 : ($j === 1 ? -300 : 200);
                $type = $balanceTypes[($index + $j) % count($balanceTypes)];
                
                BalanceHistory::create([
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'type' => $type,
                    'related_order_id' => $type === 'merch_purchase' && Order::count() > 0 ? Order::first()->id : null,
                    'related_bet_id' => $type === 'bet_win' && Bet::count() > 0 ? Bet::first()->id : null,
                    'created_at' => now()->subDays($j * 2),
                    'updated_at' => now()->subDays($j * 2),
                ]);
            }
        }

        // ========== 13. РАСПИСАНИЕ ==========
        echo "Создание расписания...\n";

        $scheduleItems = [
            ['Открытие фестиваля', 'Торжественное открытие киберфестиваля', '10:00', 1],
            ['Dota 2 - Групповой этап', 'Матчи группового этапа по Dota 2', '12:00', 1],
            ['CS2 - Квалификация', 'Квалификационные матчи по Counter-Strike 2', '14:00', 1],
            ['Valorant - Квалификация', 'Квалификационные матчи по Valorant', '15:00', 1],
            ['Косплей-шоу', 'Выступление участников косплей-конкурса', '16:00', 2],
            ['Награждение победителей', 'Церемония награждения победителей турниров', '20:00', 5],
            ['Закрытие фестиваля', 'Торжественное закрытие фестиваля', '22:00', 5],
        ];

        foreach ($scheduleItems as $item) {
            Schedule::create([
                'short_name' => $item[0],
                'description' => $item[1],
                'start_time' => $item[2],
                'day' => $item[3],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "✅ База данных успешно заполнена!\n";
    }
}