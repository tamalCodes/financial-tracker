#!/usr/bin/env bash
# Stop hook: refresh the graphify knowledge graph after a session that touched code.
# AST-only, no API cost. Best-effort — never blocks.

set -uo pipefail
dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$dir" || exit 0
command -v graphify >/dev/null 2>&1 || exit 0
graphify update . >/dev/null 2>&1 || true
exit 0
