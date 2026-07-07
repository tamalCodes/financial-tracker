#!/usr/bin/env bash
# UserPromptSubmit hook - injects the spec index so Codex consults specs BEFORE
# searching code. Keeps every task fast: one grep of the index → straight to files.
set -euo pipefail

PROJECT_DIR="${CODEX_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}}"
INDEX="$PROJECT_DIR/next-ver/specs/INDEX.md"
[ -f "$INDEX" ] || exit 0

echo "SPEC-FIRST: before writing or searching code, consult next-ver/specs/. Match the"
echo "task to a row below, open that spec, then jump to its listed files. After shipping,"
echo "update the spec + this index (AGENTS.md rule)."
echo
cat "$INDEX"
