#!/usr/bin/env bash
# Local simulation of .github/workflows/claude-qa-browser.yml
#
# Runs the same `claude` invocation the workflow does, against the local dev
# server, so you can iterate on prompts / tools without pushing to CI.
#
# Usage:
#   scripts/test-claude-qa-local.sh [focus] [pr_source]
#     focus     = fast | verify | test | explore   (default: fast)
#     pr_source = optional; either a numeric PR (→ `gh pr view`) OR
#                 a path to a fixture file with `TITLE: ...` on line 1
#                 followed by a PR-template-shaped markdown body.
#                 Fixtures live under fixtures/test-prs/*.md
#
# Requires: claude, agent-browser, gh (optional), dev server on :5173
# Env:      CLAUDE_CODE_OAUTH_TOKEN (or already-logged-in `claude`)

set -euo pipefail

FOCUS="${1:-fast}"
PR_SOURCE="${2:-}"
PR_NUMBER=""
PR_FIXTURE=""
if [[ -n "$PR_SOURCE" ]]; then
  if [[ "$PR_SOURCE" =~ ^[0-9]+$ ]]; then
    PR_NUMBER="$PR_SOURCE"
  elif [[ -f "$PR_SOURCE" ]]; then
    PR_FIXTURE="$PR_SOURCE"
  else
    echo "pr_source '$PR_SOURCE' is neither a number nor an existing file" >&2
    exit 2
  fi
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
export AGENT_BROWSER_INIT_SCRIPTS="$REPO_ROOT/.claude/scripts/qa-mobile-emulation.js"

APP_URL="http://localhost:5173"
MODEL="claude-sonnet-5"
TODAY="$(date +%Y-%m-%d)"

case "$FOCUS" in
  fast)    PROMPT_FILE=".claude/prompts/qa-browser-fast.md";    MAX_TURNS=45 ;;
  verify)  PROMPT_FILE=".claude/prompts/qa-browser-verify.md";  MAX_TURNS=100 ;;
  test)    PROMPT_FILE=".claude/prompts/qa-browser-test.md";    MAX_TURNS=60 ;;
  explore) PROMPT_FILE=".claude/prompts/qa-browser-explore.md"; MAX_TURNS=60 ;;
  *) echo "unknown focus: $FOCUS (fast|verify|test|explore)" >&2; exit 2 ;;
esac

[[ -f "$PROMPT_FILE" ]] || { echo "missing $PROMPT_FILE" >&2; exit 1; }
[[ -f ".claude/prompts/qa-system-prompt.md" ]] || { echo "missing system prompt" >&2; exit 1; }
[[ -f ".github/schemas/qa-report-schema.json" ]] || { echo "missing schema" >&2; exit 1; }

command -v claude        >/dev/null || { echo "claude CLI not found" >&2; exit 1; }
command -v agent-browser >/dev/null || { echo "agent-browser not found" >&2; exit 1; }

if ! curl -sSf -o /dev/null --max-time 2 "$APP_URL"; then
  echo "dev server not responding at $APP_URL — run 'pnpm dev' first" >&2
  exit 1
fi

# --- Fetch PR context (same fields the workflow's github-script step extracts) ---
PR_TITLE=""; PR_BODY=""; LINKED_ISSUES=""
PR_SUMMARY=""; USER_IMPACT=""; ACCEPTANCE_CRITERIA=""
QA_SCOPE=""; RISK_AREAS=""; MANUAL_TEST_SCENARIOS=""
CONTRACT_VALID="true"; MISSING_SECTIONS="None"

if [[ -n "$PR_FIXTURE" ]]; then
  echo "Loading PR fixture: $PR_FIXTURE"
  FIRST_LINE="$(head -n1 "$PR_FIXTURE")"
  if [[ "$FIRST_LINE" =~ ^TITLE:[[:space:]]*(.*)$ ]]; then
    PR_TITLE="${BASH_REMATCH[1]}"
    PR_BODY="$(tail -n +2 "$PR_FIXTURE" | sed '1{/^$/d;}')"
  else
    PR_TITLE="$(basename "$PR_FIXTURE" .md)"
    PR_BODY="$(cat "$PR_FIXTURE")"
  fi
  PR_NUMBER="${PR_NUMBER:-LOCAL}"
fi

if [[ -n "$PR_NUMBER" && -z "$PR_FIXTURE" ]] && command -v gh >/dev/null; then
  echo "Fetching PR #$PR_NUMBER metadata..."
  PR_JSON="$(gh pr view "$PR_NUMBER" --json title,body 2>/dev/null || echo '{}')"
  PR_TITLE="$(echo "$PR_JSON" | jq -r '.title // ""')"
  PR_BODY="$(echo "$PR_JSON"  | jq -r '.body  // ""')"
fi

if [[ -n "$PR_BODY" ]]; then
  extract_section() {
    # $1 = heading name; reads body from $PR_BODY
    awk -v h="## $1" '
      $0 == h {flag=1; next}
      flag && /^## / {flag=0}
      flag {print}
    ' <<<"$PR_BODY" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
  }
  PR_SUMMARY="$(extract_section Summary)"
  USER_IMPACT="$(extract_section 'User Impact')"
  ACCEPTANCE_CRITERIA="$(extract_section 'Acceptance Criteria')"
  QA_SCOPE="$(extract_section 'QA Scope')"
  RISK_AREAS="$(extract_section 'Risk Areas')"
  MANUAL_TEST_SCENARIOS="$(extract_section 'Manual Test Scenarios')"
fi

# --- Build the prompt via placeholder substitution (Python — safer than sed for multi-line) ---
PROMPT="$(
  PROMPT_FILE="$PROMPT_FILE" \
  APP_URL="$APP_URL" DATE="$TODAY" \
  PR_NUMBER="$PR_NUMBER" PR_TITLE="$PR_TITLE" PR_BODY="$PR_BODY" \
  LINKED_ISSUES="$LINKED_ISSUES" PR_SUMMARY="$PR_SUMMARY" \
  USER_IMPACT="$USER_IMPACT" ACCEPTANCE_CRITERIA="$ACCEPTANCE_CRITERIA" \
  QA_SCOPE="$QA_SCOPE" RISK_AREAS="$RISK_AREAS" \
  MANUAL_TEST_SCENARIOS="$MANUAL_TEST_SCENARIOS" \
  CONTRACT_VALID="$CONTRACT_VALID" MISSING_SECTIONS="$MISSING_SECTIONS" \
  python3 -c '
import os, sys
txt = open(os.environ["PROMPT_FILE"]).read()
for k in ["APP_URL","DATE","PR_NUMBER","PR_TITLE","PR_BODY","LINKED_ISSUES",
          "PR_SUMMARY","USER_IMPACT","ACCEPTANCE_CRITERIA","QA_SCOPE",
          "RISK_AREAS","MANUAL_TEST_SCENARIOS","CONTRACT_VALID","MISSING_SECTIONS"]:
    txt = txt.replace("{{"+k+"}}", os.environ.get(k, ""))
sys.stdout.write(txt)
'
)"

SYSTEM_PROMPT="$(cat .claude/prompts/qa-system-prompt.md)"
SCHEMA="$(jq -c . .github/schemas/qa-report-schema.json)"

rm -f qa-report.md qa-structured-output.json qa-stream.ndjson
rm -rf qa-screenshots
mkdir -p qa-screenshots

echo "── Running Claude QA locally ────────────────────────────"
echo "Focus:      $FOCUS"
echo "Model:      $MODEL"
echo "Max turns:  $MAX_TURNS"
echo "PR:         ${PR_NUMBER:-<none>}"
echo "Prompt len: ${#PROMPT} chars"
echo "Raw stream: qa-stream.ndjson"
echo "─────────────────────────────────────────────────────────"

# stream-json + --verbose emits one JSON event per turn so we can watch
# progress live. tee saves the raw stream; jq renders a readable view on
# stdout; the final `result` event is converted back to the same shape the
# old `--output-format json` produced and written to qa-structured-output.json.
claude -p "$PROMPT" \
  --model "$MODEL" \
  --max-turns "$MAX_TURNS" \
  --allowedTools "Bash(agent-browser *),Bash(curl *),Write,Read,Glob,Grep" \
  --append-system-prompt "$SYSTEM_PROMPT" \
  --output-format stream-json \
  --verbose \
  | tee qa-stream.ndjson \
  | jq -r --unbuffered '
      . as $e
      | if .type == "system" and .subtype == "init" then
          "◆ session \(.session_id // "?") · model \(.model // "?") · tools \((.tools // []) | length)"
        elif .type == "assistant" then
          (.message.content // [])
          | map(
              if .type == "text" then
                "… " + ((.text // "") | gsub("\n"; " ") | .[0:200])
              elif .type == "tool_use" then
                "→ \(.name)" +
                (if .name == "Bash" then " $ " + ((.input.command // "") | .[0:160])
                 elif .name == "Write" then " " + (.input.file_path // "")
                 elif .name == "Read"  then " " + (.input.file_path // "")
                 elif .name == "Grep"  then " /" + (.input.pattern // "") + "/"
                 elif .name == "Glob"  then " " + (.input.pattern // "")
                 else "" end)
              else empty end)
          | .[]
        elif .type == "user" then
          (.message.content // [])
          | map(select(.type == "tool_result"))
          | map("← " + (if .is_error then "ERROR " else "" end) +
                ((.content // "") | tostring | gsub("\n"; " ") | .[0:160]))
          | .[]
        elif .type == "result" then
          "◆ done · \(.subtype // "?") · \(.num_turns // 0) turns · $\(.total_cost_usd // 0)"
        else empty end' \
  || true

# Extract the final result event back into the classic json shape for
# downstream tooling that still reads qa-structured-output.json.
if [[ -s qa-stream.ndjson ]]; then
  jq -s 'map(select(.type == "result")) | .[-1] // {}' \
    qa-stream.ndjson > qa-structured-output.json
fi

# Archive the stream + outputs so the next run starts clean but prior runs
# stay inspectable. `rm -f qa-stream.ndjson ...` at the top of the script
# handles the clean slate on the next invocation.
ARCHIVE_DIR="qa-archive/$(date +%Y%m%d-%H%M%S)-$FOCUS"
mkdir -p "$ARCHIVE_DIR"
for f in qa-stream.ndjson qa-structured-output.json qa-report.md; do
  [[ -f "$f" ]] && cp "$f" "$ARCHIVE_DIR/"
done
if compgen -G "qa-screenshots/*.png" > /dev/null; then
  cp -r qa-screenshots "$ARCHIVE_DIR/"
fi
[[ -n "$PR_FIXTURE" ]] && cp "$PR_FIXTURE" "$ARCHIVE_DIR/pr-fixture.md"

echo
echo "── Done ─────────────────────────────────────────────────"
[[ -f qa-report.md ]] && echo "✓ qa-report.md written ($(wc -l <qa-report.md) lines)" \
                     || echo "✗ qa-report.md NOT written"
echo "📦 Archived run → $ARCHIVE_DIR"
