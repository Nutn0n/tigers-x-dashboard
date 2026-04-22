#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PORT=43928
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti ":$PORT" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "${PIDS:-}" ]; then
    kill $PIDS 2>/dev/null || true
    sleep 0.3
  fi
fi
npm run build
exec npx next start -p "$PORT"
