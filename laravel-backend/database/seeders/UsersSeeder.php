<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание пользователей...\n";

        // Администратор
        User::create([
            'name' => 'Александр',
            'last_name' => 'Волков',
            'login' => 'admin',
            'email' => 'admin@festival.local',
            'phone' => '+7-916-123-45-67',
            'email_verified_at' => now()->subDays(60),
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_banned' => false,
            'balance' => 0,
            'remember_token' => Str::random(10),
            'created_at' => now()->subDays(60),
        ]);

        // Организаторы (уникальные логины)
        $organizers = [
            ['Дмитрий', 'Орлов', 'org_main', 'organizer@festival.local', '+7-903-456-78-90', 5000],
            ['Екатерина', 'Морозова', 'org_cosplay', 'cosplay@festival.local', '+7-909-111-22-33', 3500],
            ['Андрей', 'Соколов', 'org_tournament', 'tournament@festival.local', '+7-905-444-55-66', 4000],
        ];

        foreach ($organizers as $org) {
            User::create([
                'name' => $org[0],
                'last_name' => $org[1],
                'login' => $org[2],
                'email' => $org[3],
                'phone' => $org[4],
                'email_verified_at' => now()->subDays(50),
                'password' => Hash::make('organizer123'),
                'role' => 'organizer',
                'is_banned' => false,
                'balance' => $org[5],
                'remember_token' => Str::random(10),
                'created_at' => now()->subDays(55),
            ]);
        }

        // 30 реальных пользователей с уникальными данными
        $users = [
            // Активные геймеры (купили билеты, делали ставки, покупали мерч)
            ['Алексей', 'Смирнов', 'alex_gamer', 'alex@mail.ru', '+7-910-111-22-33', 1200, now()->subDays(45)],
            ['Мария', 'Иванова', 'mary_play', 'mary@gmail.com', '+7-915-222-33-44', 850, now()->subDays(40)],
            ['Дмитрий', 'Кузнецов', 'dima_win', 'dima@yandex.ru', '+7-920-333-44-55', 2300, now()->subDays(38)],
            ['Анна', 'Петрова', 'anna_cosplay', 'anna@mail.ru', '+7-925-444-55-66', 400, now()->subDays(35)],
            ['Сергей', 'Васильев', 'serge_esports', 'serge@gmail.com', '+7-930-555-66-77', 5000, now()->subDays(32)],
            ['Елена', 'Михайлова', 'lena_style', 'lena@yandex.ru', '+7-935-666-77-88', 300, now()->subDays(30)],
            ['Павел', 'Новиков', 'pasha_bet', 'pasha@mail.ru', '+7-940-777-88-99', 1500, now()->subDays(28)],
            ['Ольга', 'Федорова', 'olga_gift', 'olga@gmail.com', '+7-945-888-99-00', 950, now()->subDays(25)],
            ['Илья', 'Морозов', 'ilya_pro', 'ilya@yandex.ru', '+7-950-999-00-11', 3200, now()->subDays(22)],
            ['Наталья', 'Егорова', 'nata_art', 'nata@mail.ru', '+7-955-000-11-22', 600, now()->subDays(20)],
            
            ['Владимир', 'Алексеев', 'vlad_dota', 'vlad@gmail.com', '+7-910-123-45-67', 4500, now()->subDays(45)],
            ['Юлия', 'Лебедева', 'yulia_lol', 'yulia@yandex.ru', '+7-915-234-56-78', 750, now()->subDays(42)],
            ['Максим', 'Козлов', 'max_strike', 'max@mail.ru', '+7-920-345-67-89', 2800, now()->subDays(40)],
            ['Татьяна', 'Семенова', 'tanya_cs', 'tanya@gmail.com', '+7-925-456-78-90', 1200, now()->subDays(38)],
            ['Артем', 'Григорьев', 'artem_win', 'artem@yandex.ru', '+7-930-567-89-01', 3800, now()->subDays(35)],
            ['Ксения', 'Михайлова', 'ksenia_play', 'ksenia@mail.ru', '+7-935-678-90-12', 550, now()->subDays(33)],
            ['Никита', 'Тарасов', 'nikita_bet', 'nikita@gmail.com', '+7-940-789-01-23', 2100, now()->subDays(30)],
            ['Алина', 'Белова', 'alina_cos', 'alina@yandex.ru', '+7-945-890-12-34', 850, now()->subDays(28)],
            ['Роман', 'Павлов', 'roman_gamer', 'roman@mail.ru', '+7-950-901-23-45', 1700, now()->subDays(25)],
            ['Виктория', 'Соловьева', 'vika_shop', 'vika@gmail.com', '+7-955-012-34-56', 400, now()->subDays(22)],
            
            ['Евгений', 'Орлов', 'evgen_pro', 'evgen@yandex.ru', '+7-960-123-45-67', 4200, now()->subDays(45)],
            ['Дарья', 'Никитина', 'dasha_fan', 'dasha@mail.ru', '+7-965-234-56-78', 680, now()->subDays(41)],
            ['Станислав', 'Захаров', 'stas_bet', 'stas@gmail.com', '+7-970-345-67-89', 1900, now()->subDays(38)],
            ['Екатерина', 'Смирнова', 'katya_art', 'katya@yandex.ru', '+7-975-456-78-90', 520, now()->subDays(35)],
            ['Григорий', 'Попов', 'gregory_live', 'gregory@mail.ru', '+7-980-567-89-01', 3100, now()->subDays(33)],
            ['Людмила', 'Волкова', 'luda_style', 'luda@gmail.com', '+7-985-678-90-12', 750, now()->subDays(30)],
            ['Василий', 'Сидоров', 'vasiliy_dota', 'vasiliy@yandex.ru', '+7-990-789-01-23', 2600, now()->subDays(28)],
            ['Надежда', 'Кузьмина', 'nadia_gift', 'nadia@mail.ru', '+7-995-890-12-34', 450, now()->subDays(25)],
            ['Олег', 'Фролов', 'oleg_cs', 'oleg@gmail.com', '+7-901-234-56-78', 3500, now()->subDays(22)],
            ['Инна', 'Макарова', 'inna_play', 'inna@yandex.ru', '+7-902-345-67-89', 890, now()->subDays(20)],
        ];

        foreach ($users as $userData) {
            // Проверяем уникальность логина
            $login = $userData[2];
            $counter = 1;
            while (User::where('login', $login)->exists()) {
                $login = $userData[2] . $counter;
                $counter++;
            }
            
            User::create([
                'name' => $userData[0],
                'last_name' => $userData[1],
                'login' => $login,
                'email' => $userData[3],
                'phone' => $userData[4],
                'email_verified_at' => now()->subDays(rand(10, 50)),
                'password' => Hash::make('password123'),
                'role' => 'user',
                'is_banned' => false,
                'balance' => $userData[5],
                'remember_token' => Str::random(10),
                'created_at' => $userData[6],
            ]);
        }
    }
}