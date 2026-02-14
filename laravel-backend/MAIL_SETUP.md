# Настройка отправки писем (Laravel)

Чтобы письма с логином и паролем после покупки билета реально приходили на почту, настройте переменные в файле **`.env`** (в корне `laravel-backend`).

---

## Вариант 1: Gmail

1. Включите **двухфакторную аутентификацию** в Google-аккаунте.
2. Создайте **пароль приложения**: [Google Аккаунт](https://myaccount.google.com/) → Безопасность → «Пароли приложений» → Создать (выберите «Почта»).
3. В `.env` укажите:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ваш_email@gmail.com
MAIL_PASSWORD=сгенерированный_пароль_приложения
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=ваш_email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## Вариант 2: Yandex

1. Используйте ящик на **@yandex.ru** (или @ya.ru).
2. В `.env` укажите:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.yandex.ru
MAIL_PORT=465
MAIL_USERNAME=ваш_логин@yandex.ru
MAIL_PASSWORD=пароль_от_ящика
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=ваш_логин@yandex.ru
MAIL_FROM_NAME="${APP_NAME}"
```

---

## Вариант 3: Mailtrap (только для тестов)

Письма не уходят в интернет, а попадают в личный «ящик» на Mailtrap — удобно для разработки.

1. Зарегистрируйтесь на [mailtrap.io](https://mailtrap.io).
2. В проекте откройте **Email Testing** → **Inboxes** → выберите инбокс → **SMTP Settings**.
3. В `.env` подставьте данные из раздела «Integrations» → Laravel:

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=ваш_mailtrap_username
MAIL_PASSWORD=ваш_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@festival.local"
MAIL_FROM_NAME="${APP_NAME}"
```

---

## После изменения `.env`

Перезапустите приложение (если запущено):

```bash
php artisan config:clear
php artisan serve
```

Проверка отправки (опционально):

```bash
php artisan tinker
>>> Mail::raw('Тест', fn($m) => $m->to('ваш@email.com')->subject('Проверка'));
```

Если письмо пришло — настройка корректна.
