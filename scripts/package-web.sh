#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_PATH="${1:-/tmp/web-src.tar.gz}"

mkdir -p "$(dirname "$OUTPUT_PATH")"

# Avoid macOS metadata files and never ship the local SQLite database.
export COPYFILE_DISABLE=1

tar \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='data' \
  --exclude='.DS_Store' \
  --exclude='._*' \
  -czf "$OUTPUT_PATH" \
  -C "$ROOT_DIR/packages/web" \
  .

echo "Created $OUTPUT_PATH"
