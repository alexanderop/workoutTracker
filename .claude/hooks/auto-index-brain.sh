#!/bin/bash
# auto-index-brain.sh — PostToolUse hook
# Regenerates brain/index.md when brain/ files change.
# Each entry carries a one-line description — the note's summary line (the first
# content line under its `# Title`), extracted with awk. No LLM, zero tokens.

# Consume hook input
cat > /dev/null

set -euo pipefail

BRAIN_DIR="${CLAUDE_PROJECT_DIR}/brain"
INDEX="${BRAIN_DIR}/index.md"

# No brain vault yet — nothing to index. The vault is created on demand by the
# brain/reflect skills; this hook bootstraps index.md the first time content lands.
[ -d "$BRAIN_DIR" ] || exit 0

# All .md files except index.md — relative paths without .md extension
disk=$(find "$BRAIN_DIR" -name "*.md" ! -name "index.md" -type f \
    | sed "s|^${BRAIN_DIR}/||; s|\.md$||" \
    | sort)

# Only an index (or nothing) present — leave it alone
[ -z "$disk" ] && exit 0

# A note's description: first non-blank, non-heading line after the `# Title`,
# with any list/quote marker stripped. Empty when the note has no summary line.
describe() {
    awk '
        /^[[:space:]]*$/ { next }
        /^#[[:space:]]/ && !seen { seen = 1; next }
        /^#/ { exit }
        { sub(/^[[:space:]]*([-*>][[:space:]]+)?/, ""); print; exit }
    ' "$BRAIN_DIR/$1.md"
}

# Emit a list of wikilinks, each with its description when one is present.
emit_files() {
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        desc=$(describe "$f" | tr -s '[:space:]' ' ')
        desc="${desc#"${desc%%[![:space:]]*}"}"   # trim leading space
        desc="${desc%"${desc##*[![:space:]]}"}"    # trim trailing space
        if [ "${#desc}" -gt 100 ]; then
            desc="${desc:0:99}…"
        fi
        if [ -n "$desc" ]; then
            echo "- [[$f]] — $desc"
        else
            echo "- [[$f]]"
        fi
    done
}

# Collect all top-level directories
dirs=$(echo "$disk" | grep '/' | sed 's|/.*||' | sort -u)

# Render the index body. Reading every note keeps descriptions current, so we
# render unconditionally and write only when the result actually changed — this
# also catches edited summary lines, not just added/removed files.
new=$(
    echo "# Brain"
    for section in $dirs; do
        files=$(echo "$disk" | grep "^${section}\(/\|$\)" || true)
        [ -z "$files" ] && continue
        # Capitalize first letter for header (portable across BSD/GNU)
        header="$(printf '%s' "$section" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')"
        printf '\n## %s\n' "$header"
        echo "$files" | emit_files
    done

    # Standalone files (not in any subdirectory), excluding entrypoint files
    # whose name matches a top-level directory (e.g. principles.md alongside
    # principles/) — those are already listed under their own section.
    standalone=$(echo "$disk" | grep -v '/' || true)
    if [ -n "$dirs" ] && [ -n "$standalone" ]; then
        standalone=$(echo "$standalone" | grep -vxF "$dirs" || true)
    fi
    if [ -n "$standalone" ]; then
        printf '\n## Other\n'
        echo "$standalone" | emit_files
    fi
)

# Write only when the rendered index differs from what's on disk.
if [ -f "$INDEX" ] && [ "$new" = "$(cat "$INDEX")" ]; then
    exit 0
fi
printf '%s\n' "$new" > "$INDEX"
