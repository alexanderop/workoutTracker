#!/usr/bin/env bash
# Ralph Monitor Dashboard - Auto-refreshes every 5 seconds
# Shows progress, current story, and recent activity

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
FIX_PROGRESS_FILE="$SCRIPT_DIR/fix-tests-progress.txt"
PRD_FILE="$SCRIPT_DIR/prd.json"

while true; do
    # Detect mode from progress file
    MODE="unknown"
    if [ -f "$PROGRESS_FILE" ]; then
        if grep -q "FIX-TESTS STARTED" "$PROGRESS_FILE"; then
            MODE="fix-tests"
        elif grep -q "RALPH STARTED" "$PROGRESS_FILE"; then
            MODE="ralph"
        fi
    fi
    clear
    echo "═══════════════════════════════════════════════════════"
    echo "              RALPH MONITOR DASHBOARD                  "
    echo "═══════════════════════════════════════════════════════"
    echo ""

    # Show mode-specific stats
    if [ "$MODE" = "ralph" ]; then
        # Show PRD status for ralph mode
        if [ -f "$PRD_FILE" ]; then
            TOTAL=$(jq '.userStories | length' "$PRD_FILE" 2>/dev/null || echo "?")
            DONE=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "0")
            CURRENT=$(jq -r '.userStories[] | select(.passes != true) | .id + ": " + .description' "$PRD_FILE" 2>/dev/null | head -1)

            echo "📊 Progress: $DONE / $TOTAL stories completed"
            if [ -n "$CURRENT" ] && [ "$CURRENT" != "" ]; then
                echo "🎯 Current:  $CURRENT"
            fi
            echo ""
        fi
    elif [ "$MODE" = "fix-tests" ]; then
        # Show fix-tests specific info
        echo "🔧 Mode: fix-tests"
        if [ -f "$FIX_PROGRESS_FILE" ]; then
            ITER_COUNT=$(grep -c "ITERATION" "$FIX_PROGRESS_FILE" 2>/dev/null || echo "0")
            LAST_STATUS=$(grep -E "(PASSED|FAILED|ERROR)" "$FIX_PROGRESS_FILE" 2>/dev/null | tail -1 || echo "")
            echo "🔄 Iterations: $ITER_COUNT"
            if [ -n "$LAST_STATUS" ]; then
                echo "📋 Last: $LAST_STATUS"
            fi
        fi
        echo ""
    fi

    # Show iteration info from appropriate progress file
    if [ "$MODE" = "ralph" ] && [ -f "$PROGRESS_FILE" ]; then
        LAST_ITER=$(grep -o "ITERATION [0-9]*" "$PROGRESS_FILE" 2>/dev/null | tail -1 || echo "")
        if [ -n "$LAST_ITER" ]; then
            echo "🔄 $LAST_ITER"
        fi
    elif [ "$MODE" = "fix-tests" ] && [ -f "$FIX_PROGRESS_FILE" ]; then
        LAST_ITER=$(grep -o "ITERATION [0-9]*" "$FIX_PROGRESS_FILE" 2>/dev/null | tail -1 || echo "")
        if [ -n "$LAST_ITER" ]; then
            echo "🔄 $LAST_ITER"
        fi
    fi

    echo ""
    echo "───────────────────────────────────────────────────────"
    echo "                   Recent Activity                     "
    echo "───────────────────────────────────────────────────────"

    # Show activity based on detected mode
    if [ "$MODE" = "fix-tests" ]; then
        if [ -f "$FIX_PROGRESS_FILE" ] && [ -s "$FIX_PROGRESS_FILE" ]; then
            tail -15 "$FIX_PROGRESS_FILE" 2>/dev/null
        else
            echo "(No fix-tests progress yet...)"
        fi
    elif [ "$MODE" = "ralph" ]; then
        if [ -f "$PROGRESS_FILE" ] && [ -s "$PROGRESS_FILE" ]; then
            tail -15 "$PROGRESS_FILE" 2>/dev/null
        else
            echo "(No progress yet...)"
        fi
    else
        echo "(No active session - waiting for Ralph or fix-tests to start...)"
    fi

    echo ""
    echo "───────────────────────────────────────────────────────"
    echo "              Latest Claude Actions                    "
    echo "───────────────────────────────────────────────────────"
    # Find most recent claude output file
    LATEST_OUTPUT=$(ls -t "$SCRIPT_DIR"/claude-output-*.jsonl 2>/dev/null | head -1)
    if [ -n "$LATEST_OUTPUT" ] && [ -f "$LATEST_OUTPUT" ]; then
        tail -30 "$LATEST_OUTPUT" | while read -r line; do
            type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null)
            case "$type" in
                assistant)
                    # Try to get text from message content
                    text=$(echo "$line" | jq -r '.message.content[0].text // ""' 2>/dev/null | head -c 100)
                    [ -n "$text" ] && echo "💬 $text..."
                    ;;
                content_block_start)
                    # Tool use blocks
                    tool=$(echo "$line" | jq -r '.content_block.name // ""' 2>/dev/null)
                    [ -n "$tool" ] && echo "🔧 Tool: $tool"
                    ;;
                content_block_delta)
                    # Streaming text deltas
                    delta=$(echo "$line" | jq -r '.delta.text // ""' 2>/dev/null | head -c 80)
                    [ -n "$delta" ] && echo "   $delta"
                    ;;
                result)
                    # Final result
                    echo "✅ Claude finished"
                    ;;
            esac
        done
    else
        echo "(Waiting for Claude output...)"
    fi

    echo ""
    echo "───────────────────────────────────────────────────────"
    if [ -n "$LAST_ITER" ]; then
        echo "🔄 $LAST_ITER | Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    echo "Ctrl+C to exit monitor | Ralph keeps running in top pane"

    sleep 5
done
