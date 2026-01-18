#!/usr/bin/env bash
# Ralph tmux wrapper - Creates a split-pane dashboard for monitoring Ralph
# Usage: ./ralph-tmux.sh [iterations] [script]
#   iterations: Number of iterations (default: 5)
#   script: ralph.sh or fix-tests.sh (default: ralph.sh)

SESSION_NAME="ralph-session"
ITERATIONS=${1:-5}
SCRIPT=${2:-"ralph.sh"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "Error: tmux is not installed. Please install it first:"
    echo "  macOS: brew install tmux"
    echo "  Ubuntu: sudo apt install tmux"
    exit 1
fi

# Check if session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Ralph session already running."
    echo "Options:"
    echo "  1. Attach to existing session: tmux attach -t $SESSION_NAME"
    echo "  2. Kill existing session: tmux kill-session -t $SESSION_NAME"
    read -p "Attach to existing session? [Y/n] " response
    if [[ "$response" =~ ^[Nn] ]]; then
        exit 0
    fi
    tmux attach-session -t "$SESSION_NAME"
    exit 0
fi

echo "Starting Ralph with live dashboard..."
echo "  Script: $SCRIPT"
echo "  Iterations: $ITERATIONS"
echo ""

# Clear/create progress file for fresh start
> ralph/progress.txt

# Create tmux session with Ralph in the main pane
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_ROOT"

# Enable mouse support for scrolling
tmux set -g mouse on

# Run Ralph in the top pane
tmux send-keys -t "$SESSION_NAME" "./ralph/$SCRIPT $ITERATIONS" C-m

# Split window horizontally (bottom 30%)
tmux split-window -v -t "$SESSION_NAME" -p 30 -c "$PROJECT_ROOT"

# Run monitor in the bottom pane
tmux send-keys -t "$SESSION_NAME" "./ralph/ralph-monitor.sh" C-m

# Select the top pane (Ralph)
tmux select-pane -t "$SESSION_NAME:0.0"

# Attach to the session
tmux attach-session -t "$SESSION_NAME"
