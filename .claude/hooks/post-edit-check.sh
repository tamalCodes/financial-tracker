#!/usr/bin/env bash
# PostToolUse hook: after an agent edits a .ts/.tsx file, run a fast
# typecheck + lint. On failure, exit 2 so the error is fed back to the agent to fix.
# Silent + exit 0 on success or for non-TS edits.

set -uo pipefail

payload="$(cat)"

# Extract the edited file path (no jq dependency — use node).
file_path="$(printf '%s' "$payload" | node -e \
  'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||"")}catch{process.stdout.write("")}})')"

# Only act on TS/TSX files.
case "$file_path" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

app_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
[ -d "$app_dir/node_modules" ] || { echo "[post-edit-check] node_modules missing — skipping (run: npm install)"; exit 0; }

cd "$app_dir" || exit 0

out="$(npx tsc --noEmit 2>&1)"
if [ -n "$out" ]; then
  echo "TypeScript errors after edit — fix before continuing:" >&2
  echo "$out" | head -30 >&2
  exit 2
fi

exit 0
