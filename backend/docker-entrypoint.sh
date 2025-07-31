#!/usr/bin/env sh
set -e

echo "⏳ Waiting for Postgres ($POSTGRES_HOST:$POSTGRES_PORT)…"
while ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
                   -U "$POSTGRES_USER" >/dev/null 2>&1 ; do
    sleep 1
done
echo "✅ Postgres is up"

# optional: apply migrations
python manage.py migrate --noinput

exec "$@"
