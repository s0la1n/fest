#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
file="backups/mysql-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose exec -T mysql sh -c 'exec mysqldump --single-transaction --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' | gzip -9 > "$file"
chmod 600 "$file"
echo "Backup written to $file"
