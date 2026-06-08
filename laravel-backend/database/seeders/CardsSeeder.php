<?php

namespace Database\Seeders;

use App\Models\Card;
use Illuminate\Database\Seeder;

class CardsSeeder extends Seeder
{
    public function run(): void
    {
        echo "Создание карточек маскотов-покемонов...\n";

        $cards = [
            // ========== VK PLAY - Скидка ==========
            [
                'name' => 'Виброгон',
                'description' => 'Скидка 10% на мерч в магазине фестиваля',
                'image' => '/cards/vibrogo.png',
                'rarity' => 'common',
                'stock_quantity' => 500,
                'used_quantity' => 0,
                'qr_code_get' => 'VK_VIBROGO_50',
                'qr_code_get_hash' => hash('sha256', 'VK_VIBROGO_50'),
                'type_bonus' => 'discount',
                'bonus_value' => 10,
                'coupon_code' => null,
                'status' => 'available',
            ],

            // ========== SCREAM SCHOOL - Виртуальная валюта ==========
            [
                'name' => 'Крикун',
                'description' => 'Активация бонуса виртуальной валюты: +100 монет на счёт',
                'image' => '/cards/krikun.png',
                'rarity' => 'rare',
                'stock_quantity' => 400,
                'used_quantity' => 0,
                'qr_code_get' => 'SCREAM_KRIKUN_100',
                'qr_code_get_hash' => hash('sha256', 'SCREAM_KRIKUN_100'),
                'type_bonus' => 'virtual_currency',
                'bonus_value' => 100,
                'coupon_code' => null,
                'status' => 'available',
            ],

            // ========== ОКЛИК - Промокод ==========
            [
                'name' => 'Звонок',
                'description' => 'Уникальный промокод на скидку от партнёра',
                'image' => '/cards/zvonok.png',
                'rarity' => 'common',
                'stock_quantity' => 600,
                'used_quantity' => 0,
                'qr_code_get' => 'OKLIK_ZVONOK_75',
                'qr_code_get_hash' => hash('sha256', 'OKLIK_ZVONOK_75'),
                'type_bonus' => 'coupon',
                'bonus_value' => null,
                'coupon_code' => null, // Генерируется при активации
                'status' => 'available',
            ],

            // ========== 1CGS - Физический подарок ==========
            [
                'name' => 'Тактик',
                'description' => 'Фирменный мерч от партнёра: брелок с логотипом',
                'image' => '/cards/taktik.png',
                'rarity' => 'epic',
                'stock_quantity' => 200,
                'used_quantity' => 0,
                'qr_code_get' => '1CGS_TAKTIK_150',
                'qr_code_get_hash' => hash('sha256', '1CGS_TAKTIK_150'),
                'type_bonus' => 'physical_gift',
                'bonus_value' => null,
                'coupon_code' => null,
                'status' => 'available',
            ],

            // ========== ASTRUM - Виртуальная валюта ==========
            [
                'name' => 'Звездарь',
                'description' => 'Активация бонуса виртуальной валюты: +200 монет на счёт',
                'image' => '/cards/zvezdar.png',
                'rarity' => 'epic',
                'stock_quantity' => 150,
                'used_quantity' => 0,
                'qr_code_get' => 'ASTRUM_ZVEZDAR_200',
                'qr_code_get_hash' => hash('sha256', 'ASTRUM_ZVEZDAR_200'),
                'type_bonus' => 'virtual_currency',
                'bonus_value' => 200,
                'coupon_code' => null,
                'status' => 'available',
            ],

            // ========== FPLUS - Цифровой подарок ==========
            [
                'name' => 'Фанграм',
                'description' => 'Эксклюзивный цифровой арт и обои для рабочего стола',
                'image' => '/cards/fangram.png',
                'rarity' => 'legendary',
                'stock_quantity' => 100,
                'used_quantity' => 0,
                'qr_code_get' => 'FPLUS_FANGRAM_250',
                'qr_code_get_hash' => hash('sha256', 'FPLUS_FANGRAM_250'),
                'type_bonus' => 'digital_gift',
                'bonus_value' => null,
                'coupon_code' => null,
                'status' => 'available',
            ],

            // ========== ЛЕСТА - Впечатления ==========
            [
                'name' => 'Лесник',
                'description' => 'Экскурсия за кулисы фестиваля и встреча с организаторами',
                'image' => '/cards/lesnik.png',
                'rarity' => 'legendary',
                'stock_quantity' => 80,
                'used_quantity' => 0,
                'qr_code_get' => 'LESTA_LESNIK_300',
                'qr_code_get_hash' => hash('sha256', 'LESTA_LESNIK_300'),
                'type_bonus' => 'experience',
                'bonus_value' => null,
                'coupon_code' => null,
                'status' => 'available',
            ],

            // ========== СБЕР - Виртуальная валюта (секретная) ==========
            [
                'name' => 'Копилочка',
                'description' => 'Активация бонуса виртуальной валюты: +500 монет на счёт',
                'image' => '/cards/kopilochka.png',
                'rarity' => 'secret',
                'stock_quantity' => 50,
                'used_quantity' => 0,
                'qr_code_get' => 'SBER_KOPILO_500',
                'qr_code_get_hash' => hash('sha256', 'SBER_KOPILO_500'),
                'type_bonus' => 'virtual_currency',
                'bonus_value' => 500,
                'coupon_code' => null,
                'status' => 'available',
            ],

            // ========== Дополнительная карточка - Промокод ==========
            [
                'name' => 'Волшебник',
                'description' => 'Промокод на скидку 15% в зоне фуд-корта',
                'image' => '/cards/wizard.png',
                'rarity' => 'rare',
                'stock_quantity' => 300,
                'used_quantity' => 0,
                'qr_code_get' => 'WIZARD_PROMO_15',
                'qr_code_get_hash' => hash('sha256', 'WIZARD_PROMO_15'),
                'type_bonus' => 'coupon',
                'bonus_value' => null,
                'coupon_code' => null, // Генерируется при активации
                'status' => 'available',
            ],

            // ========== Дополнительная карточка - Физический подарок ==========
            [
                'name' => 'Хранитель',
                'description' => 'Фирменная кружка с символикой фестиваля',
                'image' => '/cards/guardian.png',
                'rarity' => 'rare',
                'stock_quantity' => 250,
                'used_quantity' => 0,
                'qr_code_get' => 'GUARDIAN_MUG',
                'qr_code_get_hash' => hash('sha256', 'GUARDIAN_MUG'),
                'type_bonus' => 'physical_gift',
                'bonus_value' => null,
                'coupon_code' => null,
                'status' => 'available',
            ],
        ];

        foreach ($cards as $card) {
            Card::create($card);
            $bonusTypeText = match($card['type_bonus']) {
                'virtual_currency' => 'Виртуальная валюта (' . ($card['bonus_value'] ?? 0) . ' монет)',
                'discount' => 'Скидка (' . ($card['bonus_value'] ?? 0) . '%)',
                'coupon' => 'Промокод',
                'physical_gift' => 'Физический подарок',
                'digital_gift' => 'Цифровой подарок',
                'experience' => 'Впечатления',
                default => $card['type_bonus'],
            };
        }
    }
}