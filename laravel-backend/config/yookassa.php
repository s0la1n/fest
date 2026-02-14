<?php

return [
    'shop_id' => env('YUKASSA_SHOP_ID'),
    'secret_key' => env('YUKASSA_SECRET_KEY'),
    'api_url' => 'https://api.yookassa.ru/v3',
    // Таймауты (секунды): API ЮKassa иногда отвечает дольше 10 сек
    'timeout' => (int) env('YUKASSA_TIMEOUT', 30),
    'connect_timeout' => (int) env('YUKASSA_CONNECT_TIMEOUT', 15),
];
