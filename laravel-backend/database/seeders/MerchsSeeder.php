<?php

namespace Database\Seeders;

use App\Models\Merch;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MerchsSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание товаров магазина...\n";

        $merchItems = [
            // Футболки
            [
                'name' => 'Футболка Dota 2',
                'description' => 'Качественная футболка с принтом символики Dota 2. Хлопок 100%. Размер: L',
                'price' => 2000,
                'stock_quantity' => 100,
                'main_image' => 'shop/shirt_dota.jpg',
            ],
            [
                'name' => 'Футболка CS',
                'description' => 'Футболка с дизайном в стиле Counter-Strike',
                'price' => 1900,
                'stock_quantity' => 85,
                'main_image' => 'shop/shirt_cs.jpg',
            ],
            [
                'name' => 'Футболка Valorant',
                'description' => 'Футболка с силуэтами персонажей Valorant',
                'price' => 2000,
                'stock_quantity' => 90,
                'main_image' => 'shop/shirt_val.jpg',
            ],
            
            // Худи
            [
                'name' => 'Худи CyberFest 2026',
                'description' => 'Тёплое худи с логотипом фестиваля и вышивкой',
                'price' => 4500,
                'stock_quantity' => 60,
                'main_image' => 'shop/hoodie.jpeg',
            ],
            [
                'name' => 'Худи Team Spirit',
                'description' => 'Официальное худи команды Team Spirit',
                'price' => 5000,
                'stock_quantity' => 40,
                'main_image' => 'shop/hoodie_ts.jpg',
            ],
            [
                'name' => 'Худи Virtus.pro',
                'description' => 'Официальное худи Virtus.pro с логотипом',
                'price' => 5000,
                'stock_quantity' => 45,
                'main_image' => 'shop/hoodie_vp.jpg',
            ],
            
            // Аксессуары
            [
                'name' => 'Кепка CyberFest',
                'description' => 'Бейсболка с вышитым логотипом фестиваля',
                'price' => 1200,
                'stock_quantity' => 150,
                'main_image' => 'shop/kepka.jpg',
            ],
            [
                'name' => 'Брелок Dota 2',
                'description' => 'Металлический брелок с логотипом игры',
                'price' => 200,
                'stock_quantity' => 300,
                'main_image' => 'shop/brelok_dota.jpg',
            ],
            [
                'name' => 'Кружка CS2',
                'description' => 'Керамическая кружка с принтом CS2, 330мл',
                'price' => 300,
                'stock_quantity' => 120,
                'main_image' => 'shop/cup_cs.jpg',
            ],
            [
                'name' => 'Настенный постер Dota 2',
                'description' => 'Постер A2 с артом героев Dota 2',
                'price' => 1500,
                'stock_quantity' => 80,
                'main_image' => 'shop/poster_dota.jpg',
            ],
            
            // Коллекционные
            [
                'name' => 'Набор стикеров Valorant',
                'description' => '30 стикеров с персонажами Valorant',
                'price' => 400,
                'stock_quantity' => 250,
                'main_image' => 'shop/stik_val.jpg',
            ],
            [
                'name' => 'Геймпад проводной',
                'description' => 'Проводной геймпад с RGB-подсветкой',
                'price' => 2800,
                'stock_quantity' => 45,
                'main_image' => 'shop/gamepad.jpg',
            ],
            [
                'name' => 'Коврик для мыши XL',
                'description' => 'Большой коврик 900x400мм с картой мира Dota 2',
                'price' => 1800,
                'stock_quantity' => 40,
                'main_image' => 'shop/palace.jpg', 
            ],
            [
                'name' => 'Фигурка персонажа Dota 2',
                'description' => 'Фигурка персонажа Windrager',
                'price' => 3800,
                'stock_quantity' => 30,
                'main_image' => 'shop/wr_dota.jpg',
            ],
            [
                'name' => 'Фигурка персонажа Valorant',
                'description' => 'Фигурка персонажа из игры Valorant',
                'price' => 4000,
                'stock_quantity' => 20,
                'main_image' => 'shop/figurka_val.jpg',
            ],
            [
                'name' => 'Набор стикеров Dota 2',
                'description' => 'Наклейки с разными с персонажами',
                'price' => 200,
                'stock_quantity' => 90,
                'main_image' => 'shop/stik_dota.jpg',
            ],
        ];

        foreach ($merchItems as $index => $item) {
            $slug = Str::slug($item['name']);
            $originalSlug = $slug;
            $counter = 1;
            while (Merch::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }
            
            $merch = Merch::create([
                'name' => $item['name'],
                'slug' => $slug,
                'description' => $item['description'],
                'price' => $item['price'],
                'stock_quantity' => $item['stock_quantity'],
                'sold_quantity' => rand(5, 50),
                'main_image' => $item['main_image'],
            ]);
        }
    }
}