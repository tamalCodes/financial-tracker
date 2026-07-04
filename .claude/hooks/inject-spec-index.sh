#!/usr/bin/env bash
# UserPromptSubmit hook — injects the spec index so Claude consults specs BEFORE
# searching code. Keeps every task fast: one grep of the index → straight to files.
set -euo pipefail

INDEX="$CLAUDE_PROJECT_DIR/next-ver/specs/INDEX.md"
[ -f "$INDEX" ] || exit 0

echo "SPEC-FIRST: before writing or searching code, consult next-ver/specs/. Match the"
echo "task to a row below, open that spec, then jump to its listed files. After shipping,"
echo "update the spec + this index (CLAUDE.md rule)."
echo
cat "$INDEX"
