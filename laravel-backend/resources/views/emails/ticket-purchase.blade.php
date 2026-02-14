<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Билет на фестиваль — данные для входа</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
        .wrap { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden; }
        .head { background: linear-gradient(135deg, #0e7490 0%, #155e75 100%); color: #fff; padding: 24px; text-align: center; }
        .head h1 { margin: 0; font-size: 1.5rem; }
        .body { padding: 24px; }
        .card { background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .card strong { color: #0f172a; }
        .btn { display: inline-block; background: #0e7490; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; }
        .btn:hover { background: #155e75; }
        .foot { padding: 16px 24px; font-size: 0.875rem; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="head">
            <h1>Игровой Лабиринт — ваш билет</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Данные для входа на сайт фестиваля</p>
        </div>
        <div class="body">
            <p>Здравствуйте@if(!empty($user->name)), {{ $user->name }}@endif!</p>
            <p>Вы успешно оформили билет на фестиваль. Сохраните эти данные для входа на сайт:</p>

            <div class="card">
                <p style="margin: 0 0 8px 0;"><strong>Логин:</strong></p>
                <p style="margin: 0 0 12px 0; font-family: monospace; font-size: 1.1rem;">{{ $user->login ?? $user->email }}</p>
                <p style="margin: 0 0 8px 0;"><strong>Пароль:</strong></p>
                <p style="margin: 0; font-family: monospace; font-size: 1.1rem;">{{ $password }}</p>
            </div>

            @if(!empty($ticket))
            <p><strong>Номер билета:</strong> {{ $ticket->ticket_number ?? '' }}</p>
            <p><strong>Тип билета:</strong> {{ $ticket->type ?? '' }}</p>
            @endif

            <p>Войдите на сайт фестиваля по ссылке ниже и смените пароль в профиле при желании.</p>
            @if(!empty($login_url))
            <a href="{{ $login_url }}" class="btn">Войти на сайт</a>
            @endif
        </div>
        <div class="foot">
            Если вы не покупали билет, проигнорируйте это письмо. С уважением, команда фестиваля Игровой Лабиринт.
        </div>
    </div>
</body>
</html>
