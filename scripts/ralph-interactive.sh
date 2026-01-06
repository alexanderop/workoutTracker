#!/bin/bash
# Ralph Wiggum - Interactive mode (full tool access)
# Usage: ./scripts/ralph-interactive.sh <task-name|prompt-path> [MAX_ITERATIONS]

set -e

INPUT="${1:-}"
MAX_ITERATIONS="${2:-0}"
ITERATION=0

# Resolve prompt file location
resolve_prompt() {
  local input="$1"

  if [[ -f "$input" ]]; then
    echo "$input"
    return 0
  fi

  if [[ -f "spec/task/$input/prompt.md" ]]; then
    echo "spec/task/$input/prompt.md"
    return 0
  fi

  if [[ -z "$input" && -f "PROMPT.md" ]]; then
    echo "PROMPT.md"
    return 0
  fi

  return 1
}

get_task_dir() {
  local prompt_file="$1"
  local dir=$(dirname "$prompt_file")

  if [[ "$dir" == spec/task/* ]]; then
    echo "$dir"
  else
    echo ""
  fi
}

update_memory() {
  local task_dir="$1"
  local iteration="$2"
  local status="$3"

  if [[ -n "$task_dir" && -f "$task_dir/memory.md" ]]; then
    echo "" >> "$task_dir/memory.md"
    echo "### Iteration $iteration - $(date '+%Y-%m-%d %H:%M:%S')" >> "$task_dir/memory.md"
    echo "Status: $status" >> "$task_dir/memory.md"
  fi
}

update_spec_status() {
  local task_dir="$1"
  local status="$2"

  if [[ -n "$task_dir" && -f "$task_dir/spec.json" ]]; then
    local tmp=$(mktemp)
    sed "s/\"status\": \"[^\"]*\"/\"status\": \"$status\"/" "$task_dir/spec.json" > "$tmp"
    mv "$tmp" "$task_dir/spec.json"
  fi
}

if [[ -z "$INPUT" ]]; then
  echo "Ralph Wiggum (Interactive) - Full Tool Access"
  echo ""
  echo "Usage: $0 <task-name|prompt-path> [max-iterations]"
  echo ""
  echo "⚠️  Uses --dangerously-skip-permissions for unattended operation"
  echo ""
  echo "Available tasks:"
  if [[ -d "spec/task" ]]; then
    for dir in spec/task/*/; do
      if [[ -f "${dir}prompt.md" ]]; then
        echo "  - $(basename "$dir")"
      fi
    done
  else
    echo "  (none)"
  fi
  exit 0
fi

PROMPT_FILE=$(resolve_prompt "$INPUT") || {
  echo "Error: Cannot find prompt for '$INPUT'"
  exit 1
}

TASK_DIR=$(get_task_dir "$PROMPT_FILE")
TASK_NAME=$(basename "${TASK_DIR:-$(dirname "$PROMPT_FILE")}")
LOG_FILE="${TASK_DIR:-.}/.ralph-log-$(date +%Y%m%d-%H%M%S).txt"

echo "╔════════════════════════════════════════╗"
echo "║  Ralph Wiggum - Interactive Mode       ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Task:       $TASK_NAME"
echo "Prompt:     $PROMPT_FILE"
echo "Max iter:   ${MAX_ITERATIONS:-∞}"
echo "Log:        $LOG_FILE"
echo ""
echo "⚠️  Running with --dangerously-skip-permissions"
echo "Press Ctrl+C to stop"
echo "─────────────────────────────────────────"

update_spec_status "$TASK_DIR" "in_progress"

while :; do
  ((ITERATION++))
  echo ""
  echo "[Iteration $ITERATION - $(date '+%H:%M:%S')]" | tee -a "$LOG_FILE"

  # Run claude interactively with prompt piped in
  cat "$PROMPT_FILE" | claude --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE"

  # Check for completion in recent output
  if tail -100 "$LOG_FILE" | grep -q '<promise>'; then
    echo ""
    echo "─────────────────────────────────────────"
    echo "✓ Ralph completed at iteration $ITERATION"
    update_memory "$TASK_DIR" "$ITERATION" "COMPLETED"
    update_spec_status "$TASK_DIR" "completed"
    exit 0
  fi

  update_memory "$TASK_DIR" "$ITERATION" "running"

  if [[ $MAX_ITERATIONS -gt 0 && $ITERATION -ge $MAX_ITERATIONS ]]; then
    echo ""
    echo "─────────────────────────────────────────"
    echo "⚠ Max iterations ($MAX_ITERATIONS) reached"
    update_memory "$TASK_DIR" "$ITERATION" "STOPPED - max iterations"
    update_spec_status "$TASK_DIR" "paused"
    exit 0
  fi

  sleep 1
done
