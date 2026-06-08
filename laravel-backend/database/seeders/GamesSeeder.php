<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;

class GamesSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание игр...\n";

        $games = [
            ['name' => 'Dota 2', 'slug' => 'dota-2', 'icon_path' => '/games/dota2.png', 'description' => 'Многопользовательская онлайн-баталия', 'max_players' => 5],
            ['name' => 'Counter-Strike 2', 'slug' => 'cs2', 'icon_path' => '/games/cs2.png', 'description' => 'Тактический шутер от первого лица', 'max_players' => 5],
            ['name' => 'Valorant', 'slug' => 'valorant', 'icon_path' => '/games/valorant.png', 'description' => 'Тактический шутер с уникальными способностями', 'max_players' => 5],
        ];

        foreach ($games as $game) {
            Game::create($game);
        }
    }
}