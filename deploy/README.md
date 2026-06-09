# Production deploy: igrovoy-labirint.ru

## Принятые архитектурные и security-решения

- **Единая публичная точка входа — Nginx**: наружу опубликованы только `80/tcp` и `443/tcp`. Frontend (`3000`), PHP-FPM (`9000`) и MySQL (`3306`) доступны только внутри Docker-сетей.
- **MySQL закрыт от интернета**. Файл `docker-compose.mysql-public.example.yml` привязывает БД только к `127.0.0.1` для SSH tunnel и является опасным opt-in примером. Не используйте публичный bind без VPN/firewall и ограничения IP.
- **Canonical host — `igrovoy-labirint.ru`**. `www.igrovoy-labirint.ru` редиректится на root domain, чтобы Sanctum работал в одном origin и не возникал duplicate content. Поэтому для штатного SSL-скрипта нужны DNS A-records для обоих имён.
- **SSL — Let's Encrypt HTTP-01 через Certbot**. Первый сертификат выпускается только явным запуском `scripts/init-letsencrypt.sh`; сертификаты хранятся на VPS в `deploy/certbot/conf` и не коммитятся.
- **Миграции, seed, APP_KEY и restore никогда не запускаются автоматически**. Это защищает production-данные от неожиданных изменений. Seeder запускайте только после ревью.
- **Queue worker/scheduler не добавлены**, потому что проект использует `QUEUE_CONNECTION=sync` и подтверждённой фоновой нагрузки нет.
- `laravel-backend/.env` bind-mounted в backend (не включается в image), чтобы явная команда `key:generate` могла сохранить ключ; файл на VPS должен иметь mode `600`.
- Backend подключён к обычной Docker-сети для исходящих YooKassa/SMTP запросов и к изолированной internal-сети для MySQL. Это не публикует backend наружу.
- gzip включён; Brotli не добавлен, чтобы не усложнять стандартный Nginx image.

## Важный открытый риск payment flow

Frontend checkout вызывает `GET /api/tickets/{ticketId}`, `POST /api/tickets/{ticketId}/start-payment` и `GET /api/tickets/{ticketId}/check-status`, но backend объявляет только `POST /api/buy-ticket` и `GET|POST /api/buy-ticket/confirm`. В рамках Docker-подготовки localhost заменён на same-origin `/api`, но отсутствующие routes **не добавлялись**, потому что это меняет бизнес-логику платежей и требует согласования API-контракта. До production нужно выбрать и реализовать единый flow и протестировать YooKassa callback/return.

## 1. Подготовка DNS и Ubuntu VPS

1. Создайте A-record `igrovoy-labirint.ru` на IP VPS и A-record `www.igrovoy-labirint.ru` на тот же IP. Дождитесь распространения DNS.
2. Разрешите firewall только SSH, HTTP и HTTPS. Не разрешайте `3306`, `3000`, `9000`.
3. Установите Docker Engine и Compose plugin по официальной инструкции Docker для Ubuntu. Проверьте:

   ```bash
   docker --version
   docker compose version
   ```

4. Клонируйте репозиторий:

   ```bash
   sudo git clone <GITHUB_REPOSITORY_URL> /opt/igrovoy-labirint
   sudo chown -R "$USER":"$USER" /opt/igrovoy-labirint
   cd /opt/igrovoy-labirint
   ```

## 2. Секреты и env

```bash
cp .env.example .env
cp laravel-backend/.env.example laravel-backend/.env
chmod 600 .env laravel-backend/.env
```

Обязательно заполните/замените:

- root `.env`: `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `CERTBOT_EMAIL`; `DOMAIN` оставьте `igrovoy-labirint.ru`, пока не изменены Nginx и скрипт;
- `laravel-backend/.env`: `APP_KEY`, DB-параметры (пароль/имя/пользователь должны совпадать с root `.env`), `YUKASSA_SHOP_ID`, `YUKASSA_SECRET_KEY`, все `MAIL_*`;
- проверьте `APP_DEBUG=false`, HTTPS URL, cookie/Sanctum/CORS домены;
- frontend production build использует same-origin `/api`; пример находится в `next-frontend/.env.production.example`.

Никогда не коммитьте `.env`, сертификаты, дампы или реальные YooKassa/SMTP/DB secrets. Если секреты когда-либо были в архиве или истории Git, считайте их скомпрометированными: перевыпустите ключи/пароли и при необходимости очистите историю.

## 3. Медиа

До production build положите реальные фото и видео в:

- `next-frontend/public/images`
- `next-frontend/public/videos`

Ссылки приложения на `/images/...` и `/videos/...` сохранены; fake media не создавались. Загружаемые Laravel-файлы сохраняются в `laravel-backend/storage/app/public`, bind-mounted в backend и Nginx. Делайте их отдельный backup вместе с БД.

## 4. Первый запуск и SSL

Убедитесь, что DNS обоих имён указывает на VPS и порты 80/443 доступны, затем:

```bash
./scripts/init-letsencrypt.sh
```

Скрипт создаёт краткоживущий self-signed сертификат только для старта Nginx, выполняет HTTP-01 и заменяет его сертификатом Let's Encrypt. При ошибке проверьте DNS/firewall и повторите команду.

Регулярное обновление можно запускать cron/systemd timer (например ежедневно); команда безопасно обновляет только подходящие сертификаты и перезагружает Nginx:

```bash
cd /opt/igrovoy-labirint && docker compose --profile tools run --rm certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec nginx nginx -s reload
```

## 5. Build, запуск и Laravel initialization

```bash
docker compose build
docker compose up -d
```

Первичная инициализация выполняется явно:

```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan storage:link
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan event:cache
```

После `key:generate` сохраните новое `APP_KEY` из `laravel-backend/.env` в защищённом password manager/secret store. На последующих deploy не генерируйте новый ключ: это инвалидирует зашифрованные данные/cookies.

Seeder — только после ревью содержимого и явного решения:

```bash
docker compose exec backend php artisan db:seed --force
```

`route:cache` сейчас не является обязательным и не включён в deploy: в `routes/api.php` есть Closure routes. Можно проверить вручную; если команда не проходит, сначала вынесите closures в контроллеры:

```bash
docker compose exec backend php artisan route:cache
```

Обычный последующий deploy (без автоматических migrations/seeds):

```bash
./scripts/deploy.sh
docker compose exec backend php artisan migrate --force  # только после ревью миграций
```

## 6. Проверки и логи

```bash
curl -I https://igrovoy-labirint.ru
curl https://igrovoy-labirint.ru/api/test
curl -I https://igrovoy-labirint.ru/sanctum/csrf-cookie
curl -I https://www.igrovoy-labirint.ru

docker compose ps
docker compose logs -f nginx
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

Ожидается: root frontend — `200`, `/api/test` — JSON, Sanctum — `204`, `www` — `301` на root domain.

## 7. Backup и destructive restore

```bash
./scripts/backup-db.sh
./scripts/restore-db.sh --confirm backups/mysql-YYYYMMDDTHHMMSSZ.sql.gz
```

Backup-файлы имеют mode `600` и игнорируются Git. Храните зашифрованные off-site копии и отдельно копируйте `laravel-backend/storage/app/public`. Restore требует ручного ввода `RESTORE`, но всё равно перезаписывает production DB — перед ним остановите запись приложения и создайте свежий backup.

## 8. CI и deploy через GitHub

`.github/workflows/ci.yml` проверяет Composer/PHP и Next build. Автоматический SSH deploy намеренно не добавлен: безопасная схема требует предварительно создать deploy user, host key verification и GitHub Secrets (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `DEPLOY_PATH`). До этого deploy выполняется на VPS через `scripts/deploy.sh`.

## Production checklist / риски

- [ ] Согласован и исправлен несовпадающий payment API contract; протестированы YooKassa return/callback и идемпотентность.
- [ ] Все секреты заменены, `.env` имеет mode `600`, `APP_DEBUG=false`.
- [ ] DNS для root и `www`, firewall и SSL проверены.
- [ ] Миграции просмотрены; backup создан; seed не запускается без решения.
- [ ] Реальные frontend media присутствуют до build; Laravel uploads включены в backup.
- [ ] SMTP, письма покупки/сброса пароля и YooKassa протестированы.
- [ ] Настроены мониторинг, off-site backups и timer обновления сертификатов.
