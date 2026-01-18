#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <iterations>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"

cd "$PROJECT_ROOT"

# Structured logging function
log_progress() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$PROGRESS_FILE"
    echo "$1"
}

# Clean up old output files
rm -f "$SCRIPT_DIR"/claude-output-*.jsonl

echo "Starting Ralph automation with $1 iterations"
log_progress "RALPH STARTED - $1 iterations requested"

for ((i=1; i<=$1; i++)); do
    echo "========== Iteration $i of $1 =========="
    log_progress "ITERATION $i STARTED"

    set +e
    CLAUDE_OUTPUT="$SCRIPT_DIR/claude-output-$i.jsonl"
    > "$CLAUDE_OUTPUT"  # Clear for this iteration

    claude --dangerously-skip-permissions --verbose --output-format stream-json -p \
"@ralph/prd.json @ralph/progress.txt \
1. Find the highest-priority feature to work on and work only on that feature. \
This should be the one YOU decide has the highest priority - not necessarily the first item. \
2. Check that the types check via pnpm type-check and that the tests pass via pnpm test. \
3. Update the PRD with the work that was done. \
4. Append your progress to the progress.txt file. \
Use this to leave a note for the next person working in the codebase. \
5. Make a git commit of that feature. \
ONLY WORK ON A SINGLE FEATURE. \
If, while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>
" 2>&1 | tee "$CLAUDE_OUTPUT"

    exit_code=${PIPESTATUS[0]}
    set -e

    # Check for completion marker in the output file
    if grep -q "<promise>COMPLETE</promise>" "$CLAUDE_OUTPUT"; then
        log_progress "PRD COMPLETE - finished after $i iterations"
        echo "PRD complete, exiting."
        echo "Total iterations: $i"
        exit 0
    fi

    if [ $exit_code -ne 0 ]; then
        log_progress "WARNING: Claude exited with code $exit_code"
        echo "Warning: Claude exited with code $exit_code"
    else
        log_progress "ITERATION $i COMPLETED"
    fi

    echo "Iteration $i finished"
done

log_progress "MAX ITERATIONS ($1) REACHED"
echo "Max iterations ($1) reached"
exit 0
