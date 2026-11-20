#!/usr/bin/env bash
# Stops the backend (port 4000) and the frontend server (port 8080). Leaves PostgreSQL running.
BACKEND_PORT=4000
FRONTEND_PORT=8080

stop_port() {
  local pids
  pids=$(lsof -ti tcp:"$1" -sTCP:LISTEN 2>/dev/null)
  [ -z "$pids" ] && return 0
  echo "Stopping $2 on port $1"
  kill $pids 2>/dev/null
  for _ in 1 2 3 4 5; do
    lsof -ti tcp:"$1" -sTCP:LISTEN >/dev/null 2>&1 || return 0
    sleep 1
  done
  kill -9 $(lsof -ti tcp:"$1" -sTCP:LISTEN) 2>/dev/null
}

stop_port "$BACKEND_PORT" backend
stop_port "$FRONTEND_PORT" frontend

# nodemon (npm run dev) can respawn the backend, so clear it by name too
pkill -f "nodemon server.js" 2>/dev/null

echo "Stopped."
