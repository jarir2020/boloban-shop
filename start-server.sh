#!/usr/bin/env bash
# Start BazarHub (api-server + bazarhub frontend) locally.
#
# Adapted for this machine:
#   - MySQL (root/root on localhost) instead of Postgres.
#   - Clerk dev bypass (no real Clerk keys required) for local dev only.
#
# Requirements:
#   - MySQL running with a `bazarhub` database (root/root).
#   - pnpm install run from the repo root.
#   - Schema pushed: pnpm --filter @workspace/db run push --force
#
# Usage:
#   ./start-server.sh           # build + start both servers
#   ./start-server.sh --no-build  # skip the esbuild rebuild
#   ./start-server.sh --api     # only the api-server (port 5000)
#   ./start-server.sh --web     # only the bazarhub frontend (port 5173)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/artifacts/api-server"
WEB_DIR="$ROOT_DIR/artifacts/bazarhub"

API_PORT="${API_PORT:-5000}"
WEB_PORT="${WEB_PORT:-5173}"
API_DATABASE_URL="${API_DATABASE_URL:-mysql://root:root@localhost:3306/bazarhub}"
PID_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.run/logs"

START_API=1
START_WEB=1
DO_BUILD=1

for arg in "$@"; do
  case "$arg" in
    --api) START_WEB=0 ;;
    --web) START_API=0 ;;
    --no-build) DO_BUILD=0 ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$PID_DIR" "$LOG_DIR"

stop_existing() {
  local name="$1"
  local pidfile="$PID_DIR/$name.pid"
  if [[ -f "$pidfile" ]]; then
    local pid
    pid="$(cat "$pidfile")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping existing $name (pid $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 0.5
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  fi
  # Also free the port in case another process is holding it.
  local port="$2"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local attempts=40
  while (( attempts-- > 0 )); do
    if (echo >"/dev/tcp/127.0.0.1/$port") >/dev/null 2>&1; then
      echo "  $name is listening on port $port"
      return 0
    fi
    sleep 0.25
  done
  echo "  $name did not start on port $port in time" >&2
  return 1
}

ensure_db() {
  if ! mysql -h localhost -P 3306 -u root -proot \
      -e "USE bazarhub;" >/dev/null 2>&1; then
    echo "Creating MySQL database 'bazarhub'..."
    mysql -h localhost -P 3306 -u root -proot \
      -e "CREATE DATABASE IF NOT EXISTS bazarhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  fi
  echo "Pushing Drizzle schema..."
  ( cd "$ROOT_DIR/lib/db" && \
    DATABASE_URL="$API_DATABASE_URL" \
      ./node_modules/.bin/drizzle-kit push --config ./drizzle.config.ts --force )
}

start_api() {
  if [[ "$DO_BUILD" == "1" ]]; then
    echo "Building api-server..."
    ( cd "$API_DIR" && node ./build.mjs )
  fi

  ensure_db

  stop_existing api "$API_PORT"
  echo "Starting api-server on port $API_PORT..."
  (
    cd "$API_DIR"
    DATABASE_URL="$API_DATABASE_URL" \
    PORT="$API_PORT" \
    NODE_ENV=development \
    CLERK_DEV_BYPASS=true \
    nohup node --enable-source-maps ./dist/index.mjs \
      >"$LOG_DIR/api.log" 2>&1 &
    echo $! >"$PID_DIR/api.pid"
  )
  wait_for_port "$API_PORT" "api-server"
  echo "  logs: $LOG_DIR/api.log"
}

start_web() {
  stop_existing web "$WEB_PORT"
  echo "Starting bazarhub on port $WEB_PORT..."
  (
    cd "$WEB_DIR"
    PORT="$WEB_PORT" \
    BASE_PATH=/ \
    VITE_CLERK_DEV_BYPASS=true \
    nohup ./node_modules/.bin/vite --config vite.config.ts --host 0.0.0.0 \
      >"$LOG_DIR/web.log" 2>&1 &
    echo $! >"$PID_DIR/web.pid"
  )
  wait_for_port "$WEB_PORT" "bazarhub"
  echo "  logs: $LOG_DIR/web.log"
}

trap 'echo "Interrupted" >&2; exit 130' INT TERM

if [[ "$START_API" == "1" ]]; then start_api; fi
if [[ "$START_WEB" == "1" ]]; then start_web; fi

cat <<EOF

BazarHub is running.
  api-server  http://localhost:$API_PORT
  bazarhub    http://localhost:$WEB_PORT

Logs:  $LOG_DIR
PIDs:  $PID_DIR
Stop:  kill \$(cat $PID_DIR/api.pid $PID_DIR/web.pid 2>/dev/null)
EOF
