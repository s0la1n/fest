#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
[ -f .env ] && [ -f laravel-backend/.env ] || { echo "Create root .env and laravel-backend/.env first." >&2; exit 1; }
git pull --ff-only
docker compose build --pull
docker compose up -d --remove-orphans
docker compose --profile tools run --rm certbot renew --webroot -w /var/www/certbot --quiet || true
docker compose exec nginx nginx -s reload
docker compose ps
printf '%s\n' 'Deploy completed. Migrations and seeds were NOT run. Run migrations explicitly after reviewing them.'
