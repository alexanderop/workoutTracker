---
name: git-worktree
description: Set up parallel development workspaces using git worktree for working on multiple features simultaneously with separate Claude Code sessions. Use when asked to "work on multiple features", "parallel development", "set up worktrees", "multiple branches at once", or when detecting that a user needs to work on several features concurrently. Also triggers for "separate Claude Code sessions" or "work in parallel".
---

# Git Worktree for Parallel Development

Enable working on multiple features simultaneously by creating separate worktrees, each with its own Claude Code session.

## Quick Start

```bash
# Create worktrees for multiple features
.claude/skills/git-worktree/scripts/setup-worktrees.sh dashboard admin mobile

# Open separate terminals and start Claude Code in each:
# Terminal 1: cd ../workoutTracker-features/dashboard && claude
# Terminal 2: cd ../workoutTracker-features/admin && claude
# Terminal 3: cd ../workoutTracker-features/mobile && claude
```

## Workflow

### 1. Setup Worktrees

Use the helper script to create worktrees:

```bash
.claude/skills/git-worktree/scripts/setup-worktrees.sh <feature1> <feature2> [feature3...]
```

This creates:
- Parent directory: `../{project-name}-features/`
- Worktree per feature: `../{project-name}-features/{feature}/`
- Branch per feature: `feature/{feature}`

Manual alternative:
```bash
mkdir ../project-features
git worktree add ../project-features/dashboard -b feature/dashboard
git worktree add ../project-features/admin -b feature/admin
```

### 2. Work in Parallel

Open separate terminal windows and start Claude Code in each worktree:

```bash
cd ../project-features/dashboard && claude
cd ../project-features/admin && claude
cd ../project-features/mobile && claude
```

Each session works independently on its own branch without conflicts.

### 3. Test Integration

Periodically test how features work together:

```bash
# In main project directory
git merge feature/dashboard --no-commit
git merge feature/admin --no-commit
pnpm test
git reset --hard HEAD  # Reset if issues found
```

### 4. Merge and Cleanup

When features are complete:

```bash
# Merge each feature
git checkout main
git merge feature/dashboard
git merge feature/admin
git merge feature/mobile

# Clean up worktrees
.claude/skills/git-worktree/scripts/cleanup-worktrees.sh --all
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `git worktree add <path> -b <branch>` | Create worktree with new branch |
| `git worktree add <path> <branch>` | Create worktree from existing branch |
| `git worktree list` | List all worktrees |
| `git worktree remove <path>` | Remove a worktree |

## Best Practices

- Keep features independent to avoid merge conflicts
- Commit frequently in each worktree
- Test integration before final merge
- Use descriptive branch names: `feature/`, `fix/`, `refactor/`
