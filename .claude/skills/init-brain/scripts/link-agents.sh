#!/bin/bash
# link-agents.sh — symlink AGENTS.md -> CLAUDE.md so every harness (Claude Code,
# Codex, Cursor, Zed, …) reads one onboarding file. Idempotent and safe: it
# never clobbers a real AGENTS.md that holds content.
#
# Exit codes: 0 = linked or already correct; 1 = no CLAUDE.md to link to;
# 2 = a real AGENTS.md file exists and must be reconciled by hand.

set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
CLAUDE_MD="$ROOT/CLAUDE.md"
AGENTS_MD="$ROOT/AGENTS.md"

if [ ! -f "$CLAUDE_MD" ]; then
  echo "No CLAUDE.md at $CLAUDE_MD — author it first, then re-run." >&2
  exit 1
fi

# Already the symlink we want.
if [ -L "$AGENTS_MD" ] && [ "$(readlink "$AGENTS_MD")" = "CLAUDE.md" ]; then
  echo "AGENTS.md -> CLAUDE.md already linked."
  exit 0
fi

# A real (non-symlink) AGENTS.md already exists — do not destroy it.
if [ -e "$AGENTS_MD" ] && [ ! -L "$AGENTS_MD" ]; then
  echo "AGENTS.md already exists as a regular file — leaving it untouched." >&2
  echo "Reconcile by hand: merge its content into CLAUDE.md, delete AGENTS.md," >&2
  echo "then re-run this script (or: ln -s CLAUDE.md AGENTS.md)." >&2
  exit 2
fi

# Dangling symlink, symlink to something else, or nothing — point it at CLAUDE.md.
ln -sf CLAUDE.md "$AGENTS_MD"
echo "Linked AGENTS.md -> CLAUDE.md"
