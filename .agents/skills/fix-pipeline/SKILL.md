---
name: fix-pipeline
description: Inspect GitHub Actions / CI status for the current branch and plan fixes when checks fail. Use proactively after pushing, or when the user mentions "CI", "pipeline", "GitHub Actions", "failing checks", "build failing", or asks "why is CI red".
allowed-tools: Bash(gh pr checks:*), Bash(gh run list:*), Bash(gh run view:*), Bash(gh api:*), Bash(git rev-parse:*), Bash(git branch:*), EnterPlanMode
---

# Check Pipeline Status

I have gathered information about your pipeline. Here are the results:

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<check_runs>
!`gh run list --branch $(git rev-parse --abbrev-ref HEAD) --limit 5`
</check_runs>

<latest_run_details>
!`gh run view --branch $(git rev-parse --abbrev-ref HEAD) --log-failed 2>/dev/null || echo "No failed logs available"`
</latest_run_details>

## Instructions

### Step 1: Analyze Pipeline Status

1. **Check the run status** from the `<check_runs>` section above.
2. If all checks are passing, inform the user and stop.
3. If any checks are failing, proceed to Step 2.

### Step 2: Gather Failure Details

1. **Examine the failed logs** in `<latest_run_details>`.
2. If more details are needed, use `gh run view <run-id> --log-failed` to get specific failure information.
3. Identify the root cause of the failure (test failures, lint errors, type errors, build issues, etc.).

### Step 3: Enter Plan Mode

If the pipeline is failing:

1. **Summarize the failures** clearly for the user.
2. **Enter plan mode** using the EnterPlanMode tool.
3. In plan mode, create a detailed plan to fix the issues, including:
   - What specifically failed
   - Which files need to be modified
   - The steps to fix each issue
   - How to verify the fix locally before pushing
