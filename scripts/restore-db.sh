#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
[ "${1:-}" = "--confirm" ] && [ -n "${2:-}" ] || { echo "DESTRUCTIVE: usage: $0 --confirm backups/file.sql.gz" >&2; exit 2; }
file=$2
[ -f "$file" ] || { echo "Backup not found: $file" >&2; exit 1; }
printf 'Restoring %s into the configured production database. Continue? [type RESTORE] ' "$file"
read answer
[ "$answer" = RESTORE ] || { echo "Cancelled"; exit 1; }
gzip -dc "$file" | docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
echo "Restore completed."
