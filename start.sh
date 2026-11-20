#!/usr/bin/env bash
# Starts PostgreSQL (if needed), the backend on :4000 and the built frontend on :8080.
# Stops anything already running on those ports first, so it can be run repeatedly.
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/.run"
export PATH="/opt/homebrew/opt/postgresql@16/bin:/opt/homebrew/bin:$PATH"
mkdir -p "$LOGS"

"$ROOT/stop.sh"

if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo "Starting PostgreSQL"
  brew services start postgresql@16 >/dev/null 2>&1
  for _ in $(seq 1 15); do
    pg_isready -h localhost -p 5432 >/dev/null 2>&1 && break
    sleep 1
  done
  pg_isready -h localhost -p 5432 >/dev/null 2>&1 || { echo "PostgreSQL did not start"; exit 1; }
fi

cd "$ROOT/backend" || exit 1
[ -d node_modules ] || npm install >"$LOGS/backend-install.log" 2>&1

# Create the database and tables on first run, then seed the demo users (skips ones that exist)
psql -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='civic-events-db'" | grep -q 1 \
  || createdb -U postgres -h localhost -p 5432 "civic-events-db"
psql -U postgres -h localhost -p 5432 -d civic-events-db -tAc "SELECT to_regclass('public.users')" | grep -q users \
  || psql -q -U postgres -h localhost -p 5432 -d civic-events-db -f migrations/001_create_tables.sql >"$LOGS/migrate.log" 2>&1
node "$ROOT/scripts/seed-users.mjs" || { echo "Seeding users failed"; exit 1; }

echo "Starting backend"
nohup npm run dev >"$LOGS/backend.log" 2>&1 &

echo "Building frontend"
cd "$ROOT/frontend" || exit 1
[ -d node_modules ] || npm install >"$LOGS/frontend-install.log" 2>&1
npm run build >"$LOGS/frontend-build.log" 2>&1 || { echo "Frontend build failed, see .run/frontend-build.log"; exit 1; }
nohup python3 -m http.server 8080 --directory dist >"$LOGS/frontend.log" 2>&1 &

for _ in $(seq 1 15); do
  curl -s -o /dev/null localhost:4000/api/events && break
  sleep 1
done

node "$ROOT/scripts/seed-events.mjs" || echo "Seeding events failed (see above)"

echo "Backend:  http://localhost:4000  (log: .run/backend.log)"
echo "Frontend: http://localhost:8080  (log: .run/frontend.log)"
echo "Stop with ./stop.sh"
