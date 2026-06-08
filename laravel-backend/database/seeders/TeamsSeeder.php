<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\Team;
use Illuminate\Database\Seeder;

class TeamsSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание команд...\n";

        $games = Game::all();
        
        $teamsData = [
            'Dota 2' => [
                ['name' => 'Team Spirit', 'tag' => 'SPIRIT', 'city' => 'Москва'],
                ['name' => 'Virtus.pro', 'tag' => 'VP', 'city' => 'Санкт-Петербург'],
                ['name' => 'Natus Vincere', 'tag' => 'NAVI', 'city' => 'Киев'],
                ['name' => 'OG', 'tag' => 'OG', 'city' => 'Москва'],
                ['name' => 'Team Liquid', 'tag' => 'LQD', 'city' => 'Екатеринбург'],
                ['name' => 'Gaimin Gladiators', 'tag' => 'GG', 'city' => 'Новосибирск'],
                ['name' => 'BetBoom Team', 'tag' => 'BB', 'city' => 'Казань'],
                ['name' => '9Pandas', 'tag' => 'PND', 'city' => 'Нижний Новгород'],
            ],
            'Counter-Strike 2' => [
                ['name' => 'Cloud9', 'tag' => 'C9', 'city' => 'Москва'],
                ['name' => 'Virtus.pro', 'tag' => 'VPCS', 'city' => 'Санкт-Петербург'],
                ['name' => 'Natus Vincere', 'tag' => 'NVCS', 'city' => 'Краснодар'],
                ['name' => 'Team Spirit', 'tag' => 'SPCS', 'city' => 'Москва'],
                ['name' => 'Gambit Esports', 'tag' => 'GMB', 'city' => 'Екатеринбург'],
                ['name' => 'forZe', 'tag' => 'FRZ', 'city' => 'Новосибирск'],
                ['name' => 'Entropiq', 'tag' => 'ETQ', 'city' => 'Казань'],
                ['name' => 'K23', 'tag' => 'K23', 'city' => 'Челябинск'],
            ],
            'Valorant' => [
                ['name' => 'Gambit Esports', 'tag' => 'GMT', 'city' => 'Москва'],
                ['name' => 'M3 Champions', 'tag' => 'M3C', 'city' => 'Санкт-Петербург'],
                ['name' => 'FunPlus Phoenix', 'tag' => 'FPX', 'city' => 'Ростов-на-Дону'],
                ['name' => 'Team Heretics', 'tag' => 'THV', 'city' => 'Москва'],
                ['name' => 'Fnatic', 'tag' => 'FNCV', 'city' => 'Екатеринбург'],
                ['name' => 'LOUD', 'tag' => 'LDV', 'city' => 'Новосибирск'],
                ['name' => 'DRX', 'tag' => 'DRXV', 'city' => 'Казань'],
                ['name' => 'Paper Rex', 'tag' => 'PRX', 'city' => 'Челябинск'],
            ],
        ];

        foreach ($games as $game) {
            echo "  Команды для: {$game->name}\n";
            $teamsList = $teamsData[$game->name] ?? [];
            
            foreach ($teamsList as $teamData) {
                Team::create([
                    'game_id' => $game->id,
                    'team_name' => $teamData['name'],
                    'tag' => $teamData['tag'],
                    'city' => $teamData['city'],
                    'status' => 'active',
                ]);
            }
        }
    }
}