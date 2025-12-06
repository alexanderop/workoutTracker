---
description: Open a pull request from the current branch
allowed-tools: Bash(git status), Bash(git diff:*), Bash(git log:*), Bash(git push:*), Bash(git rev-parse:*), Bash(git remote:*), Bash(gh pr:*), Bash(gh api:*)
---

# Open Pull Request

I have gathered information about your branch. Here are the results:

<git_status>
!`git status`
</git_status>

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<main_branch>
!`git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's|origin/||' || echo "main"`
</main_branch>

<commits_on_branch>
!`git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline main..HEAD 2>/dev/null || echo "Could not determine commits"`
</commits_on_branch>

<full_diff>
!`git diff origin/main...HEAD 2>/dev/null || git diff main...HEAD 2>/dev/null || echo "Could not determine diff"`
</full_diff>

<recent_commit_messages>
!`git log --format="%s%n%b" origin/main..HEAD 2>/dev/null || git log --format="%s%n%b" main..HEAD 2>/dev/null || echo "Could not determine commits"`
</recent_commit_messages>

<existing_pr>
!`gh pr view --json number,title,state 2>/dev/null || echo "No existing PR"`
</existing_pr>

## Instructions

### Step 1: Check for uncommitted changes

If there are uncommitted changes, ask the user if they want to commit them first or proceed without them.

### Step 2: Push the branch (if needed)

Ensure the branch is pushed to the remote:
```bash
git push -u origin <current-branch>
```

### Step 3: Analyze changes and generate PR description

1. **Review all commits** on this branch (not just the latest one)
2. **Analyze the full diff** to understand what changed
3. **Generate a descriptive PR title** following conventional commit format:
   - `feat(scope): description` for new features
   - `fix(scope): description` for bug fixes
   - `refactor(scope): description` for refactoring
   - `docs(scope): description` for documentation
   - `test(scope): description` for tests
   - `chore(scope): description` for maintenance

4. **Generate a comprehensive PR body** with:
   - **Summary**: 2-4 bullet points describing the key changes
   - **Test plan**: How to verify the changes work

### Step 4: Create the PR

Use `gh pr create` with a HEREDOC for proper formatting:

```bash
gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## Summary
- Key change 1
- Key change 2
- Key change 3

## Test plan
- [ ] Step to verify change 1
- [ ] Step to verify change 2
EOF
)"
```

### Step 5: Show the result

Display the PR URL so the user can review it in the browser.

## Notes

- If a PR already exists for this branch, inform the user and show the existing PR URL
- Base branch defaults to `main` unless the user specifies otherwise
- Include all relevant changes from ALL commits, not just the most recent one
