---
name: fix-pipeline
description: Inspect GitHub Actions / CI status for the current branch and plan fixes when checks fail. Use proactively after pushing, or when the user mentions "CI", "pipeline", "GitHub Actions", "failing checks", "build failing", or asks "why is CI red".
allowed-tools: Bash(gh pr checks:*), Bash(gh run list:*), Bash(gh run view:*), Bash(gh api:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(command -v gh:*), EnterPlanMode
---

# Check Pipeline Status

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<gh_cli>
!`command -v gh >/dev/null 2>&1 && echo "available" || echo "NOT available - use the GitHub MCP tools (mcp__github__*) instead"`
</gh_cli>

## Instructions

### Step 1: Fetch Pipeline Status

Use whichever GitHub access method `<gh_cli>` says is available:

**If `gh` is available:**

```bash
gh run list --branch <current_branch> --limit 5
gh run view <run-id> --log-failed   # for failing runs
```

**If `gh` is NOT available (e.g. remote/web sessions), use the GitHub MCP tools** (load them via ToolSearch if needed):

1. `mcp__github__actions_list` with `method: "list_workflow_runs"` and the current branch to get recent runs.
2. For a failing run, `mcp__github__actions_list` with `method: "list_workflow_jobs"` to find the failed job(s).
3. `mcp__github__get_job_logs` with `failed_only: true` (or a specific `job_id`) to pull the failure logs.

### Step 2: Analyze

1. If all checks are passing, inform the user and stop.
2. If checks are failing, examine the failed logs and identify the root cause (test failures, lint errors, type errors, build issues, etc.).

### Step 3: Enter Plan Mode

If the pipeline is failing:

1. **Summarize the failures** clearly for the user.
2. **Enter plan mode** using the EnterPlanMode tool.
3. In plan mode, create a detailed plan to fix the issues, including:
   - What specifically failed
   - Which files need to be modified
   - The steps to fix each issue
   - How to verify the fix locally before pushing
