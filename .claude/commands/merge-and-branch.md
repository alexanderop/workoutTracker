---
description: Merge current PR into main and create a new branch
allowed-tools: Bash(gh pr view:*), Bash(gh pr merge:*), Bash(git checkout:*), Bash(git pull:*), Bash(git branch:*), Bash(git status:*)
---

# Merge PR and Create Branch

I have gathered information about the current PR and git state. Here are the results:

<current_pr>
!`gh pr view --json number,title,state,url,headRefName`
</current_pr>

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<git_status>
!`git status --short`
</git_status>

## Instructions

### Step 1: Verify PR is ready

1. **Check the PR state** - ensure it's OPEN and ready to merge.
2. **Check for uncommitted changes** - warn if there are local changes that might be lost.

### Step 2: Merge the PR

3. **Merge with squash** and delete the branch:
   ```bash
   gh pr merge <number> --squash --delete-branch
   ```

### Step 3: Switch to main

4. **Checkout main** and pull latest:
   ```bash
   git checkout main && git pull
   ```

### Step 4: Create new branch

5. **Ask the user** for the new branch name using AskUserQuestion tool.

6. **Create the branch**:
   ```bash
   git checkout -b <branch-name>
   ```

7. **Confirm** the new branch was created with `git branch --show-current`.
