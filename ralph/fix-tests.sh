#!/usr/bin/env bash
set -e

# Configuration
TIMEOUT_SECONDS=${TIMEOUT:-600}  # 10 min default, configurable via env
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

echo "Starting test-fixing automation (timeout: ${TIMEOUT_SECONDS}s per iteration)"
log_progress "FIX-TESTS STARTED (timeout: ${TIMEOUT_SECONDS}s)"

iteration=0

while true; do
    ((iteration++))
    echo "========== Iteration $iteration =========="
    log_progress "ITERATION $iteration STARTED"

    # Run tests and capture exit code
    set +e
    pnpm test --run
    test_exit=$?
    set -e

    # ONLY exit when tests pass - this is the ONLY exit condition
    if [ $test_exit -eq 0 ]; then
        log_progress "ALL TESTS PASS - completed after $iteration iterations"
        echo "All tests pass! Total iterations: $iteration"
        exit 0
    fi

    log_progress "Tests failing - invoking Claude to fix..."
    echo "Tests failing. Invoking Claude to fix one test..."

    # Call Claude with timeout and streaming output
    set +e
    CLAUDE_OUTPUT="$SCRIPT_DIR/claude-output-$iteration.jsonl"
    > "$CLAUDE_OUTPUT"

    timeout "${TIMEOUT_SECONDS}" claude --dangerously-skip-permissions --verbose \
        --output-format stream-json -p \
        "@ralph/fix-tests-progress.txt
1. Run 'pnpm test' to identify which test is failing.
2. Focus on fixing ONE failing test case only.
3. After fixing, run 'pnpm test:browser' to verify it also passes in browser mode.
4. If the fix breaks browser mode, adjust until both pass.

IMPORTANT - SKIPPING TESTS THAT DON'T WORK IN HAPPY-DOM:
If a test genuinely cannot work in Happy-DOM (e.g., requires real browser APIs like
getComputedStyle, getBoundingClientRect, real drag events, or Playwright-specific features),
you may skip it for Happy-DOM using this pattern:

  const isBrowserMode = globalThis.window !== undefined && '__vitest_browser__' in globalThis
  describe.skipIf(!isBrowserMode)('Test suite name', () => { ... })
  // or for individual tests:
  it.skipIf(!isBrowserMode)('test name', () => { ... })

Only skip if the test TRULY cannot run in Happy-DOM. First try to fix it properly.

5. Append your progress to ralph/fix-tests-progress.txt with:
   - Which test you fixed (or skipped)
   - What the issue was
   - How you fixed it (or why you skipped it for Happy-DOM)
6. Commit the fix with a descriptive message.
ONLY FIX ONE TEST CASE PER ITERATION." 2>&1 | tee "$CLAUDE_OUTPUT"

    claude_exit=${PIPESTATUS[0]}
    set -e

    if [ $claude_exit -eq 124 ]; then
        log_progress "WARNING: Claude timed out after ${TIMEOUT_SECONDS}s"
        echo "Warning: Claude timed out after ${TIMEOUT_SECONDS}s"
    elif [ $claude_exit -ne 0 ]; then
        log_progress "WARNING: Claude exited with code $claude_exit"
        echo "Warning: Claude exited with code $claude_exit"
    else
        log_progress "ITERATION $iteration COMPLETED"
    fi

    echo "Iteration $iteration complete. Looping to verify tests..."
done
