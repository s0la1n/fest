<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        echo "Начало заполнения базы данных...\n";

        $this->call(UsersSeeder::class);
        $this->call(GamesSeeder::class);
        $this->call(TicketsSeeder::class);
        $this->call(CosplayersSeeder::class);
        $this->call(TeamsSeeder::class);
        $this->call(TeamPlayersSeeder::class);
        $this->call(MerchsSeeder::class);
        $this->call(OrdersSeeder::class);
        $this->call(BetsSeeder::class);
        $this->call(BalanceHistorySeeder::class);
        $this->call(ScheduleSeeder::class);
        $this->call(CardsSeeder::class);
    }
}