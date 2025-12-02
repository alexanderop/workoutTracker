#!/bin/bash
# Cleanup git worktrees
# Usage: cleanup-worktrees.sh [--all | --force | --delete-branches] [feature1 feature2...]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Get project name and features directory
PROJECT_NAME=$(basename "$(pwd)")
FEATURES_DIR="../${PROJECT_NAME}-features"

# Parse flags
REMOVE_ALL=false
FORCE=false
DELETE_BRANCHES=false
FEATURES=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            REMOVE_ALL=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --delete-branches)
            DELETE_BRANCHES=true
            shift
            ;;
        --help|-h)
            echo "Usage: cleanup-worktrees.sh [OPTIONS] [feature1 feature2...]"
            echo ""
            echo "Options:"
            echo "  --all              Remove all worktrees in the features directory"
            echo "  --force, -f        Skip confirmation prompt"
            echo "  --delete-branches  Also delete the feature branches"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Examples:"
            echo "  cleanup-worktrees.sh dashboard admin    # Remove specific worktrees"
            echo "  cleanup-worktrees.sh --all              # Remove all worktrees"
            echo "  cleanup-worktrees.sh --all --delete-branches  # Remove all and delete branches"
            exit 0
            ;;
        *)
            FEATURES+=("$1")
            shift
            ;;
    esac
done

# Check if features directory exists
if [ ! -d "$FEATURES_DIR" ]; then
    echo -e "${YELLOW}No features directory found at: ${FEATURES_DIR}${NC}"
    echo "Nothing to clean up."
    exit 0
fi

# Get list of worktrees to remove
WORKTREES_TO_REMOVE=()

if [ "$REMOVE_ALL" = true ]; then
    # Get all directories in features directory
    for dir in "$FEATURES_DIR"/*/; do
        if [ -d "$dir" ]; then
            feature=$(basename "$dir")
            WORKTREES_TO_REMOVE+=("$feature")
        fi
    done
else
    # Use provided feature names
    WORKTREES_TO_REMOVE=("${FEATURES[@]}")
fi

# Check if there's anything to remove
if [ ${#WORKTREES_TO_REMOVE[@]} -eq 0 ]; then
    echo -e "${YELLOW}No worktrees specified to remove.${NC}"
    echo "Use --all to remove all worktrees, or specify feature names."
    exit 0
fi

# Show what will be removed
echo -e "${BLUE}Worktrees to remove:${NC}"
for feature in "${WORKTREES_TO_REMOVE[@]}"; do
    WORKTREE_PATH="${FEATURES_DIR}/${feature}"
    if [ -d "$WORKTREE_PATH" ]; then
        echo "  - ${WORKTREE_PATH} (branch: feature/${feature})"
    else
        echo -e "  - ${RED}${WORKTREE_PATH} (not found)${NC}"
    fi
done
echo ""

if [ "$DELETE_BRANCHES" = true ]; then
    echo -e "${YELLOW}Branches will also be deleted${NC}"
    echo ""
fi

# Confirm unless --force is used
if [ "$FORCE" = false ]; then
    read -p "Proceed with cleanup? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

# Remove worktrees
REMOVED=()
for feature in "${WORKTREES_TO_REMOVE[@]}"; do
    WORKTREE_PATH="${FEATURES_DIR}/${feature}"
    BRANCH_NAME="feature/${feature}"

    if [ -d "$WORKTREE_PATH" ]; then
        echo -e "${BLUE}Removing worktree: ${WORKTREE_PATH}${NC}"
        git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || rm -rf "$WORKTREE_PATH"
        REMOVED+=("$feature")

        # Delete branch if requested
        if [ "$DELETE_BRANCHES" = true ]; then
            if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
                echo -e "${BLUE}Deleting branch: ${BRANCH_NAME}${NC}"
                git branch -D "$BRANCH_NAME" 2>/dev/null || true
            fi
        fi
    fi
done

# Clean up empty features directory
if [ -d "$FEATURES_DIR" ] && [ -z "$(ls -A "$FEATURES_DIR")" ]; then
    rmdir "$FEATURES_DIR"
    echo -e "${GREEN}Removed empty features directory${NC}"
fi

# Prune worktree references
git worktree prune

echo ""
echo -e "${GREEN}=== Cleanup Complete ===${NC}"
echo ""
echo "Removed ${#REMOVED[@]} worktree(s)"
echo ""
echo "Remaining worktrees:"
git worktree list
