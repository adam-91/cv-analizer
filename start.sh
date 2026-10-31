#!/usr/bin/env bash
set -euo pipefail

# Start the CV Analyzer locally: FastAPI backend + Vite frontend.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PID=""

cleanup() {
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Starting backend on http://localhost:8000 ..."
(
  cd "$BACKEND_DIR"
  if [[ -f .venv/bin/activate ]]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  fi
  exec uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 ..."
cd "$FRONTEND_DIR"
npm run dev
