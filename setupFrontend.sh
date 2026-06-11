#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

required_files=(
  "templates/base.html"
  "templates/components/sidebar.html"
  "templates/dashboard.html"
  "templates/library.html"
  "templates/upload.html"
  "templates/calendar.html"
  "templates/daily_view.html"
  "templates/topic/detail.html"
  "templates/mcq/list.html"
  "templates/mcq/practice.html"
  "templates/todos/list.html"
  "static/css/style.css"
  "static/js/main.js"
  "static/js/upload.js"
  "static/js/calendar.js"
  "static/js/topic.js"
  "static/js/mcq.js"
)

missing=0
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf 'Missing required frontend file: %s\n' "$file" >&2
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

printf 'Frontend files are present. Run ./setupBackend.sh run to start Nexus.\n'
