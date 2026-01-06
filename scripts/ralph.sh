#!/bin/bash
# Ralph Wiggum Technique - Continuous AI Loop
# Usage: ./scripts/ralph.sh <task-name|prompt-path> [MAX_ITERATIONS]
#
# Examples:
#   ./scripts/ralph.sh add-dark-mode 10        # Uses spec/task/add-dark-mode/prompt.md
#   ./scripts/ralph.sh spec/task/foo/prompt.md # Direct path
#   ./scripts/ralph.sh PROMPT.md 5             # Standalone prompt

set -e

INPUT="${1:-}"
MAX_ITERATIONS="${2:-0}"  # 0 = infinite
ITERATION=0

# Resolve prompt file location
resolve_prompt() {
  local input="$1"

  # Direct path to file
  if [[ -f "$input" ]]; then
    echo "$input"
    return 0
  fi

  # Task name → spec/task/<name>/prompt.md
  if [[ -f "spec/task/$input/prompt.md" ]]; then
    echo "spec/task/$input/prompt.md"
    return 0
  fi

  # Default
  if [[ -z "$input" && -f "PROMPT.md" ]]; then
    echo "PROMPT.md"
    return 0
  fi

  return 1
}

# Get task directory (if using spec/task structure)
get_task_dir() {
  local prompt_file="$1"
  local dir=$(dirname "$prompt_file")

  if [[ "$dir" == spec/task/* ]]; then
    echo "$dir"
  else
    echo ""
  fi
}

# Update memory.md with iteration info
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

# Update spec.json status
update_spec_status() {
  local task_dir="$1"
  local status="$2"

  if [[ -n "$task_dir" && -f "$task_dir/spec.json" ]]; then
    # Use temp file for safe update
    local tmp=$(mktemp)
    sed "s/\"status\": \"[^\"]*\"/\"status\": \"$status\"/" "$task_dir/spec.json" > "$tmp"
    mv "$tmp" "$task_dir/spec.json"
  fi
}

# Show usage
if [[ -z "$INPUT" ]]; then
  echo "Ralph Wiggum - Continuous AI Loop"
  echo ""
  echo "Usage: $0 <task-name|prompt-path> [max-iterations]"
  echo ""
  echo "Examples:"
  echo "  $0 add-dark-mode 10       # spec/task/add-dark-mode/prompt.md"
  echo "  $0 ./PROMPT.md 5          # Direct path"
  echo ""
  echo "Available tasks:"
  if [[ -d "spec/task" ]]; then
    for dir in spec/task/*/; do
      if [[ -f "${dir}prompt.md" ]]; then
        echo "  - $(basename "$dir")"
      fi
    done
  else
    echo "  (none - run /ralph-new to create one)"
  fi
  exit 0
fi

# Resolve prompt file
PROMPT_FILE=$(resolve_prompt "$INPUT") || {
  echo "Error: Cannot find prompt for '$INPUT'"
  echo "Tried:"
  echo "  - $INPUT (as file)"
  echo "  - spec/task/$INPUT/prompt.md"
  echo ""
  echo "Create a task with: /ralph-new"
  exit 1
}

TASK_DIR=$(get_task_dir "$PROMPT_FILE")
TASK_NAME=$(basename "${TASK_DIR:-$(dirname "$PROMPT_FILE")}")

echo "╔════════════════════════════════════════╗"
echo "║  Ralph Wiggum - Continuous AI Loop     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Task:       $TASK_NAME"
echo "Prompt:     $PROMPT_FILE"
echo "Max iter:   ${MAX_ITERATIONS:-∞}"
if [[ -n "$TASK_DIR" ]]; then
  echo "Task dir:   $TASK_DIR"
  echo "Memory:     $TASK_DIR/memory.md"
fi
echo ""
echo "Press Ctrl+C to stop"
echo "─────────────────────────────────────────"

# Update status to in_progress
update_spec_status "$TASK_DIR" "in_progress"

while :; do
  ((ITERATION++))
  echo ""
  echo "[Iteration $ITERATION - $(date '+%H:%M:%S')]"
  echo ""

  # Run claude with the prompt
  OUTPUT=$(cat "$PROMPT_FILE" | claude --print 2>&1)
  echo "$OUTPUT"

  # Check for completion promise
  if echo "$OUTPUT" | grep -q '<promise>.*</promise>'; then
    echo ""
    echo "─────────────────────────────────────────"
    echo "✓ Ralph completed at iteration $ITERATION"
    echo "  Promise detected in output"
    update_memory "$TASK_DIR" "$ITERATION" "COMPLETED - promise detected"
    update_spec_status "$TASK_DIR" "completed"
    exit 0
  fi

  # Update memory with iteration
  update_memory "$TASK_DIR" "$ITERATION" "running"

  # Check max iterations
  if [[ $MAX_ITERATIONS -gt 0 && $ITERATION -ge $MAX_ITERATIONS ]]; then
    echo ""
    echo "─────────────────────────────────────────"
    echo "⚠ Ralph stopped: max iterations ($MAX_ITERATIONS) reached"
    update_memory "$TASK_DIR" "$ITERATION" "STOPPED - max iterations"
    update_spec_status "$TASK_DIR" "paused"
    exit 0
  fi

  # Small delay to prevent hammering
  sleep 2
done
