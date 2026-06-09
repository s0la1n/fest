#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "Root .env is required" >&2; exit 1; }
set -a; . ./.env; set +a
: "${DOMAIN:?Set DOMAIN in .env}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env}"
[ "$DOMAIN" = "igrovoy-labirint.ru" ] || { echo "Nginx config currently targets igrovoy-labirint.ru; update it before changing DOMAIN." >&2; exit 1; }
mkdir -p deploy/certbot/www
make_dummy() {
  mkdir -p "deploy/certbot/conf/live/$DOMAIN"
  docker run --rm -v "$PWD/deploy/certbot/conf:/etc/letsencrypt" alpine/openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -subj "/CN=$DOMAIN"
}
dummy_created=0
if [ ! -f "deploy/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
  make_dummy
  dummy_created=1
fi
docker compose up -d nginx frontend backend mysql
# Nginx keeps the loaded dummy certificate in memory while Certbot creates its managed live/ symlinks.
[ "$dummy_created" -eq 0 ] || rm -rf "deploy/certbot/conf/live/$DOMAIN"
if docker compose --profile tools run --rm certbot certonly --webroot -w /var/www/certbot \
  --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --force-renewal \
  --cert-name "$DOMAIN" -d "$DOMAIN" -d "www.$DOMAIN"; then
  docker compose exec nginx nginx -s reload
  echo "Let's Encrypt certificate installed."
else
  [ "$dummy_created" -eq 0 ] || make_dummy
  echo "Certificate request failed; nginx keeps the currently loaded temporary certificate. Fix DNS/firewall and rerun." >&2
  exit 1
fi
