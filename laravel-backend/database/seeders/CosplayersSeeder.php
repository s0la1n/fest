<?php

namespace Database\Seeders;

use App\Models\Cosplayer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CosplayersSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание участников косплея...\n";

        $cosplayers = [
            [
                'name' => 'Александра', 'last_name' => 'Волкова',
                'character_name' => 'Чёрный Кот', 'origin' => 'Леди Баг и Супер-Кот',
                'bio' => 'Профессиональная косплеерша. Шьёт костюмы полностью сама. Участвовала в 15+ фестивалях.',
                'photo' => 'cosplayers/blackcat.jpg', 'votes' => rand(180, 250),
            ],
            [
                'name' => 'Дмитрий', 'last_name' => 'Хаосов',
                'character_name' => 'Дискорд', 'origin' => 'My Little Pony',
                'bio' => 'Мастер по сценическому гриму и спецэффектам. Сам создал костюм Дискорда.',
                'photo' => 'cosplayers/discord.jpg', 'votes' => rand(150, 220),
            ],
            [
                'name' => 'Екатерина', 'last_name' => 'Механикова',
                'character_name' => 'Дива', 'origin' => 'Overwatch',
                'bio' => 'Инженер-конструктор. Построила свой мех-костюм весом 15 кг со светодиодами.',
                'photo' => 'cosplayers/dva.jpg', 'votes' => rand(200, 280),
            ],
            [
                'name' => 'Артём', 'last_name' => 'Скороходов',
                'character_name' => 'Шэдоу', 'origin' => 'Sonic the Hedgehog',
                'bio' => 'Профессиональный паркурщик. Исполняет трюки в костюме Шэдоу.',
                'photo' => 'cosplayers/shadow.jpg', 'votes' => rand(120, 180),
            ],
            [
                'name' => 'Анна', 'last_name' => 'Туманная',
                'character_name' => 'Хинако Симидзу', 'origin' => 'Silent Hill f',
                'bio' => 'Актриса театра. Перевоплощение в главную героиню Silent Hill в японском сеттинге.',
                'photo' => 'cosplayers/shf.jpg', 'votes' => rand(100, 150),
            ],
            [
                'name' => 'Ольга', 'last_name' => 'Савельева',
                'character_name' => 'Медсестра', 'origin' => 'Silent Hill',
                'bio' => 'Профессиональный визажист и модель. Специализируется на хоррор-косплее.',
                'photo' => 'cosplayers/silent.jpg', 'votes' => rand(130, 190),
            ],
            [
                'name' => 'Максим', 'last_name' => 'Филлипс',
                'character_name' => 'Стэнфорд', 'origin' => 'Гравити Фолз',
                'bio' => 'Любитель загадок и аномалий. Использует 3D-печать для реквизита.',
                'photo' => 'cosplayers/stan.jpg', 'votes' => rand(90, 140),
            ],
            [
                'name' => 'Дарья', 'last_name' => 'Баттерфляй',
                'character_name' => 'Стар Баттерфляй', 'origin' => 'Стар против сил зла',
                'bio' => 'Танцовщица. Шьёт все костюмы самостоятельно, в том числе магическую палочку.',
                'photo' => 'cosplayers/star.jpg', 'votes' => rand(110, 160),
            ],
            [
                'name' => 'Елена', 'last_name' => 'Линова',
                'character_name' => 'Чун Ли', 'origin' => 'Street Fighter',
                'bio' => 'Мастер боевых искусств, чемпионка по тхэквондо.',
                'photo' => 'cosplayers/chunli.jpg', 'votes' => rand(160, 230),
            ],
            [
                'name' => 'Константин', 'last_name' => 'Векторов',
                'character_name' => 'Джон Сильвер', 'origin' => 'Cyberpunk 2077',
                'bio' => 'Специалист по неону и светодиодам. Костюм светится в темноте.',
                'photo' => 'cosplayers/silver.jpg', 'votes' => rand(140, 200),
            ],
            [
                'name' => 'Полина', 'last_name' => 'Звонкова',
                'character_name' => 'Джинкс', 'origin' => 'Arcane / League of Legends',
                'bio' => 'Модель и косплеерша. Создала пневматический ракетомет.',
                'photo' => 'cosplayers/jinx.jpg', 'votes' => rand(220, 300),
            ],
            [
                'name' => 'Николай', 'last_name' => 'Стальной',
                'character_name' => 'Железный человек', 'origin' => 'Marvel',
                'bio' => 'Инженер-робототехник. Собрал рабочий репульсор на ардуино.',
                'photo' => 'cosplayers/iron.jpg', 'votes' => rand(170, 240),
            ],
        ];

        foreach ($cosplayers as $c) {
            $cosplayer = Cosplayer::create([
                'name' => $c['name'],
                'last_name' => $c['last_name'],
                'character_name' => $c['character_name'],
                'origin' => $c['origin'],
                'photo' => $c['photo'],
                'biography' => $c['bio'],
                'portfolio_link' => 'https://instagram.com/' . Str::slug($c['character_name']),
                'votes_count' => $c['votes'],
                'voted_users' => [],
            ]);
        }
    }
}