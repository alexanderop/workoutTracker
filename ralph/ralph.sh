#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <iterations>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Starting Ralph automation with $1 iterations"

for ((i=1; i<=$1; i++)); do
    echo "========== Iteration $i of $1 =========="

    set +e
    output=$(claude --dangerously-skip-permissions -p "@ralph/prd.json @ralph/progress.txt \
1. Find the highest-priority feature to work on and work only on that feature. \
This should be the one YOU decide has the highest priority - not necessarily the first item. \
2. Check that the types check via pnpm type-check and that the tests pass via pnpm test. \
3. Update the PRD with the work that was done. \
4. Append your progress to the progress.txt file. \
Use this to leave a note for the next person working in the codebase. \
5. Make a git commit of that feature. \
ONLY WORK ON A SINGLE FEATURE. \
If, while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>
" 2>&1)
    exit_code=$?
    set -e

    if echo "$output" | grep -q "<promise>COMPLETE</promise>"; then
        echo "PRD complete, exiting."
        echo "Total iterations: $i"
        exit 0
    fi

    if [ $exit_code -ne 0 ]; then
        echo "Warning: Claude exited with code $exit_code"
    fi

    echo "Iteration $i finished"
done

echo "Max iterations ($1) reached"
exit 0
