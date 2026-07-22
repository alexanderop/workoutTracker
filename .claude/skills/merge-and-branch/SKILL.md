---
name: merge-and-branch
description: Squash-merge the current PR into main, delete the branch, pull latest, and start a new feature branch. Use when the user says "merge this PR", "merge and start new branch", or is done with a PR and ready to start the next task.
allowed-tools: Bash(gh pr view:*), Bash(gh pr checks:*), Bash(gh pr merge:*), Bash(gh api:*), Bash(git checkout:*), Bash(git pull:*), Bash(git branch:*), Bash(git status:*), Bash(pnpm -s pr:comments:*), Bash(command -v gh:*), AskUserQuestion
---

# Merge PR and Create Branch

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<git_status>
!`git status --short`
</git_status>

<gh_cli>
!`command -v gh >/dev/null 2>&1 && echo "available" || echo "NOT available - use the GitHub MCP tools (mcp__github__*) instead"`
</gh_cli>

## Instructions

### Step 1: Preflight — a PR merges only when it is actually done

Run ALL of these checks before merging. With `gh`:

```bash
gh pr view --json number,title,state,isDraft,mergeable,reviewDecision,url,headRefName
gh pr checks                      # every check green (or explicitly neutral)
pnpm -s pr:comments --json        # must be [] — no unresolved review threads
```

Without `gh` (remote/web sessions), use the GitHub MCP tools:
`mcp__github__pull_request_read` with methods `get` (state, draft,
reviewDecision), `get_status` + `get_check_runs` (CI), and
`get_review_comments` (any thread with `is_resolved: false` blocks).

**Refuse to merge — and say exactly why — if any of these hold:**

- PR is not OPEN, or is a draft, or has merge conflicts.
- Any check is failing or still running (use the fix-pipeline skill for red
  CI; wait for pending checks, don't race them).
- Any review thread is unresolved (run the review-coderabbit skill first).
- `reviewDecision` is `CHANGES_REQUESTED` — CodeRabbit auto-approves once its
  threads are resolved, so this clears itself when the findings are handled.
- There are uncommitted local changes that belong in the PR.

Only the user may override a failed preflight; ask with AskUserQuestion and
name the specific risk being overridden.

### Step 2: Merge the PR

```bash
gh pr merge <number> --squash --delete-branch
```

(Without `gh`: `mcp__github__merge_pull_request` with `merge_method: squash`.)

### Step 3: Switch to main

```bash
git checkout main && git pull
```

### Step 4: Create new branch

1. **Ask the user** for the new branch name using AskUserQuestion.
2. **Create it**: `git checkout -b <branch-name>`.
3. **Confirm** with `git branch --show-current`.
