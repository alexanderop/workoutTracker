#!/bin/bash
# init-brain.sh — scaffold an empty brain vault in the project.
# Idempotent: creates brain/ and its entrypoints only if missing, never clobbers.
# Also detects existing doc sites (VitePress, Docusaurus, …) and seeds a
# brain/sources/ note per site so the brain points at them instead of absorbing
# them. The skill's LLM step refines each stub's scope line afterwards.

set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
BRAIN_DIR="$ROOT/brain"
INDEX="$BRAIN_DIR/index.md"

created=0

if [ ! -d "$BRAIN_DIR" ]; then
  mkdir -p "$BRAIN_DIR"
  created=1
fi

# brain/principles/ holds engineering/design principles; principles.md is its
# index entrypoint. The flow reads these before acting, so scaffold them.
if [ ! -d "$BRAIN_DIR/principles" ]; then
  mkdir -p "$BRAIN_DIR/principles"
  created=1
fi

if [ ! -f "$BRAIN_DIR/principles.md" ]; then
  printf '# Principles\n\nProject engineering and design principles. One topic per file in `principles/`, linked here as `[[principles/<name>]]`.\n' > "$BRAIN_DIR/principles.md"
  created=1
fi

# brain/codebase/ holds durable, prescription-free "as-is" maps of the project
# structure, authored by map-codebase; codebase.md is its index entrypoint.
if [ ! -d "$BRAIN_DIR/codebase" ]; then
  mkdir -p "$BRAIN_DIR/codebase"
  created=1
fi

if [ ! -f "$BRAIN_DIR/codebase.md" ]; then
  printf '# Codebase\n\nDurable as-is maps of the project structure, authored by `map-codebase`. One area per file in `codebase/`, linked here as `[[codebase/<area>]]`. Reference only — no recommendations.\n' > "$BRAIN_DIR/codebase.md"
  created=1
fi

# brain/plans/ is where grill and the `plan` skill write — scaffold it too.
if [ ! -d "$BRAIN_DIR/plans" ]; then
  mkdir -p "$BRAIN_DIR/plans"
  created=1
fi

if [ ! -f "$BRAIN_DIR/plans/index.md" ]; then
  printf '# Plans\n' > "$BRAIN_DIR/plans/index.md"
  created=1
fi

# brain/context.md is the domain glossary grill grows; brain/decisions/ holds
# ADRs. Both are read by the flow before acting, so scaffold their entrypoints.
if [ ! -f "$BRAIN_DIR/context.md" ]; then
  printf '# Context\n\nProject domain glossary. Grown by `grill` as terms are resolved. One term per definition; split large domains into `context/<area>.md` notes linked from here.\n' > "$BRAIN_DIR/context.md"
  created=1
fi

if [ ! -d "$BRAIN_DIR/decisions" ]; then
  mkdir -p "$BRAIN_DIR/decisions"
  created=1
fi

if [ ! -f "$BRAIN_DIR/decisions/index.md" ]; then
  printf '# Decisions\n\nArchitecture decision records (ADRs), numbered `NNNN-slug.md`. Offered by `grill` for hard-to-reverse, trade-off-driven decisions.\n' > "$BRAIN_DIR/decisions/index.md"
  created=1
fi

if [ ! -f "$INDEX" ]; then
  {
    echo "# Brain"
    echo ""
    echo "## Principles"
    echo "- [[principles]]"
    echo ""
    echo "## Codebase"
    echo "- [[codebase]]"
    echo ""
    echo "## Context"
    echo "- [[context]]"
    echo ""
    echo "## Decisions"
    echo "- [[decisions/index]]"
    echo ""
    echo "## Plans"
    echo "- [[plans/index]]"
  } > "$INDEX"
  created=1
fi

# ---------------------------------------------------------------------------
# Doc-site detection
# Find existing documentation sites and point the brain at them. We reference,
# never copy: the team keeps their docs where they are. Each detected site gets
# a stub note under brain/sources/ that the SKILL's LLM step fleshes out.
# ---------------------------------------------------------------------------

# All project files, skipping vendored/build dirs. Prefer git (fast, respects
# .gitignore); fall back to find for non-git projects.
list_files() {
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$ROOT" ls-files
  else
    find "$ROOT" \
      \( -name node_modules -o -name .git -o -name dist -o -name build \
         -o -name .next -o -name vendor -o -name .venv \) -prune -o \
      -type f -print | sed "s|^${ROOT}/||"
  fi
}

# True if a dependency name appears in the doc-root's or repo-root's package.json.
dep_present() { # $1 = docroot (relative), $2 = dependency name
  for pj in "$ROOT/$1/package.json" "$ROOT/package.json"; do
    [ -f "$pj" ] && grep -q "\"$2\"" "$pj" 2>/dev/null && return 0
  done
  return 1
}

# Emit one tab-separated detection record: generator, docroot, config path.
emit() { printf '%s\t%s\t%s\n' "$1" "$2" "$3"; }

# grep that never aborts the script when there is no match (set -e + pipefail).
match() { grep -E "$1" || true; }

detect_doc_sites() {
  local files; files="$(list_files)"

  # VitePress / VuePress — config lives in a .vitepress/.vuepress dir; the
  # docs root is that dir's parent.
  printf '%s\n' "$files" | match '(^|/)\.vitepress/config\.' | while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in .vitepress/*) root=. ;; *) root="${f%/.vitepress/*}" ;; esac
    emit VitePress "$root" "$f"
  done
  printf '%s\n' "$files" | match '(^|/)\.vuepress/config\.' | while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in .vuepress/*) root=. ;; *) root="${f%/.vuepress/*}" ;; esac
    emit VuePress "$root" "$f"
  done

  # Docusaurus / MkDocs — config sits at the docs-project root.
  printf '%s\n' "$files" | match '(^|/)docusaurus\.config\.' | while IFS= read -r f; do
    [ -z "$f" ] && continue
    d="$(dirname "$f")"; emit Docusaurus "$d" "$f"
  done
  printf '%s\n' "$files" | match '(^|/)mkdocs\.ya?ml$' | while IFS= read -r f; do
    [ -z "$f" ] && continue
    d="$(dirname "$f")"; emit MkDocs "$d" "$f"
  done

  # Astro Starlight / Nextra — generic config names, so confirm via the
  # matching dependency before claiming a docs site.
  printf '%s\n' "$files" | match '(^|/)astro\.config\.' | while IFS= read -r f; do
    [ -z "$f" ] && continue
    d="$(dirname "$f")"
    dep_present "$d" "@astrojs/starlight" && emit "Astro Starlight" "$d" "$f"
  done
  printf '%s\n' "$files" | match '(^|/)theme\.config\.' | while IFS= read -r f; do
    [ -z "$f" ] && continue
    d="$(dirname "$f")"
    dep_present "$d" "nextra" && emit Nextra "$d" "$f"
  done

  # Sphinx — conf.py is ambiguous; require a sibling .rst to confirm.
  printf '%s\n' "$files" | match '(^|/)conf\.py$' | while IFS= read -r f; do
    [ -z "$f" ] && continue
    d="$(dirname "$f")"
    if ls "$ROOT/$d"/*.rst >/dev/null 2>&1; then emit Sphinx "$d" "$f"; fi
  done
}

# Turn a docroot path (or, at repo root, the generator name) into a filename
# slug: lowercase, non-alphanumerics collapsed to single hyphens.
slug_for() { # $1 = docroot, $2 = generator (fallback at repo root)
  src="$1"
  if [ "$src" = "." ] || [ -z "$src" ]; then src="$2"; fi
  printf '%s' "$src" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' \
    | sed 's/^-*//; s/-*$//'
}

DETECT="$(mktemp)"
trap 'rm -f "$DETECT"' EXIT
detect_doc_sites | awk 'NF' | sort -u > "$DETECT"

detected_report=""
if [ -s "$DETECT" ]; then
  mkdir -p "$BRAIN_DIR/sources"

  if [ ! -f "$BRAIN_DIR/sources.md" ]; then
    printf '# Sources\n\nExternal authoritative docs the brain points at — read these in place, do not copy them into the vault. One note per doc site in `sources/`.\n' > "$BRAIN_DIR/sources.md"
    created=1
  fi

  while IFS="$(printf '\t')" read -r gen docroot config; do
    [ -z "$gen" ] && continue
    slug="$(slug_for "$docroot" "$gen")"
    note="$BRAIN_DIR/sources/$slug.md"
    where="$docroot"; [ "$where" = "." ] && where="(repo root)"
    if [ ! -f "$note" ]; then
      {
        printf '# %s docs — %s\n\n' "$gen" "$where"
        printf '%s documentation site at `%s` — authoritative; read it there, do not duplicate it into the brain.\n\n' "$gen" "$where"
        printf -- '- Generator: %s\n' "$gen"
        printf -- '- Config: `%s`\n' "$config"
        printf -- '- Docs root: `%s`\n' "$where"
        printf -- '- Scope: _TODO — what these docs cover (filled in by init-brain)_\n'
      } > "$note"
      created=1
    fi
    # Keep the entrypoint linking to the note (append once, idempotent).
    if ! grep -q "\[\[sources/$slug\]\]" "$BRAIN_DIR/sources.md" 2>/dev/null; then
      printf -- '- [[sources/%s]]\n' "$slug" >> "$BRAIN_DIR/sources.md"
    fi
    detected_report="${detected_report}  - ${gen} at ${where} -> brain/sources/${slug}.md"$'\n'
  done < "$DETECT"
fi

if [ "$created" -eq 1 ]; then
  echo "Brain vault ready at: $BRAIN_DIR"
else
  echo "Brain vault already exists at: $BRAIN_DIR (nothing to do)"
fi

if [ -n "$detected_report" ]; then
  echo ""
  echo "Detected doc sites — stubs seeded (refine each Scope line):"
  printf '%s' "$detected_report"
fi
