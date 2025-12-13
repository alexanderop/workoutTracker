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
   - **Test plan**: Precise, actionable steps (see guidelines below)

#### Test Plan Guidelines

Write test plans for **handover to a QA engineer** using **Cucumber/Gherkin style** (Given/When/Then). Must be **completable in under 5 minutes**:

- **Self-contained**: QA should execute without reading code or PR description
- **Gherkin format**: Use Given (precondition), When (action), Then (expected result)
- **Concrete examples**: Include specific text/values QA should see
- **End with CI checks**: Always include `pnpm type-check && pnpm lint && pnpm test`
- **3-5 scenarios max**: Focus on the most critical user-facing changes

Example:
```
Scenario: German locale shows localized dates
  Given I open the app and navigate to Settings
  When I change the language to "Deutsch"
  And I navigate to History
  Then month headers display German format (e.g., "Dezember 2024")
```

### Step 4: Create the PR

Use `gh pr create` with a HEREDOC for proper formatting:

```bash
gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## Summary
- Key change 1
- Key change 2
- Key change 3

## Test plan
Prerequisites: Run `pnpm dev` and open http://localhost:5173

- [ ] **Scenario 1: [Brief description]**
  - Given [precondition/starting state]
  - When [action performed]
  - Then [expected result with example]

- [ ] **Scenario 2: [Brief description]**
  - Given [precondition]
  - When [action]
  - Then [result]

- [ ] Run `pnpm type-check && pnpm lint && pnpm test` - all pass
EOF
)"
```

### Step 5: Show the result

Display the PR URL so the user can review it in the browser.

## Notes

- If a PR already exists for this branch, inform the user and show the existing PR URL
- Base branch defaults to `main` unless the user specifies otherwise
- Include all relevant changes from ALL commits, not just the most recent one
