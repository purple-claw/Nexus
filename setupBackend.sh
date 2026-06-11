#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PYTHON="${PYTHON:-python3}"
VENV_PY="$ROOT_DIR/venv/bin/python"
VENV_PIP="$ROOT_DIR/venv/bin/pip"

usage() {
  printf 'Usage: %s [install|reset-db|run|check]\n' "$0"
}

ensure_venv() {
  if [[ ! -x "$VENV_PY" ]]; then
    "$PYTHON" -m venv venv
  fi
}

install() {
  ensure_venv
  "$VENV_PIP" install -r requirements.txt
}

reset_db() {
  ensure_venv
  rm -f instance/app.db
  "$VENV_PY" - <<'PY'
from main import create_app

create_app()
print("Database reset and initialized at instance/app.db")
PY
}

check() {
  ensure_venv
  "$VENV_PY" -m compileall config.py database.py main.py parser.py navigation.py routes services
}

run() {
  ensure_venv
  "$VENV_PY" main.py
}

case "${1:-check}" in
  install) install ;;
  reset-db) reset_db ;;
  run) run ;;
  check) check ;;
  *) usage; exit 2 ;;
esac
