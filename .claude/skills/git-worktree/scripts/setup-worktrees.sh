#!/bin/bash
# Setup git worktrees for parallel development
# Usage: setup-worktrees.sh <feature1> <feature2> [feature3...]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Check for at least one feature argument
if [ $# -eq 0 ]; then
    echo -e "${RED}Usage: setup-worktrees.sh <feature1> <feature2> [feature3...]${NC}"
    echo "Example: setup-worktrees.sh dashboard admin mobile"
    exit 1
fi

# Get project name from current directory
PROJECT_NAME=$(basename "$(pwd)")
FEATURES_DIR="../${PROJECT_NAME}-features"

# Create features directory if it doesn't exist
if [ ! -d "$FEATURES_DIR" ]; then
    mkdir -p "$FEATURES_DIR"
    echo -e "${GREEN}Created features directory: ${FEATURES_DIR}${NC}"
fi

echo -e "${BLUE}Setting up worktrees for: $*${NC}"
echo ""

# Create worktree for each feature
CREATED_WORKTREES=()
for feature in "$@"; do
    WORKTREE_PATH="${FEATURES_DIR}/${feature}"
    BRANCH_NAME="feature/${feature}"

    # Check if worktree already exists
    if [ -d "$WORKTREE_PATH" ]; then
        echo -e "${RED}Worktree already exists: ${WORKTREE_PATH}${NC}"
        continue
    fi

    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
        echo -e "${BLUE}Branch exists, creating worktree from existing branch: ${BRANCH_NAME}${NC}"
        git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
    else
        echo -e "${GREEN}Creating new worktree with branch: ${BRANCH_NAME}${NC}"
        git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
    fi

    CREATED_WORKTREES+=("$feature")
done

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""

# Show summary
if [ ${#CREATED_WORKTREES[@]} -gt 0 ]; then
    echo "Created worktrees:"
    for feature in "${CREATED_WORKTREES[@]}"; do
        echo "  - ${FEATURES_DIR}/${feature} (branch: feature/${feature})"
    done
    echo ""
    echo -e "${BLUE}To start Claude Code sessions, open separate terminals and run:${NC}"
    echo ""
    for feature in "${CREATED_WORKTREES[@]}"; do
        echo "  cd ${FEATURES_DIR}/${feature} && claude"
    done
fi

echo ""
echo "Current worktrees:"
git worktree list
