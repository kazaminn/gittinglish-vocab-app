#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${BASE_REF:-origin/master}"

# base ref が取れないケースに備えて fetch（既にあるなら軽い）
git fetch --no-tags --prune --depth=0 origin master >/dev/null 2>&1 || true

MERGE_BASE="$(git merge-base "$BASE_REF" HEAD)"

# 変更ファイル一覧（Vitestが扱える可能性が高いものに寄せる）
CHANGED_FILES="$(git diff --name-only "$MERGE_BASE"...HEAD \
  | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|mts|cts|json)$' || true)"

if [[ -z "$CHANGED_FILES" ]]; then
  echo "[test:related] No relevant changed files; fallback to full test."
  npm run test
  exit 0
fi

echo "[test:related] Running vitest related for changed files:"
echo "$CHANGED_FILES"

# vitest related はファイル引数が必要（改行→スペース）
vitest related --run $(echo "$CHANGED_FILES" | tr '\n' ' ')