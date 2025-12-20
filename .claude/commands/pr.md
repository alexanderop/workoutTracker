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

Write test plans that a **QA engineer can execute in 5 minutes** without reading the code or PR diff.

**Every test plan MUST include:**

1. **Prerequisites section** - setup steps before testing (dev server, database state)
2. **Numbered scenarios** with descriptive titles
3. **Given/When/Then** structure for each scenario
4. **Concrete expected results** - exact text, values, or UI states to verify
5. **CI checks** as the final item

**Bad example (too vague):**
```
- [ ] Open EmomConfig dialog and verify rotation toggle works
- [ ] Navigate to Workouts view and verify tab switching works
```

**Good example (executable by QA):**
```
**Prerequisites:**
- Run `pnpm dev` and open http://localhost:5173
- Database state: empty (clear localStorage if needed)

- [ ] **Scenario 1: EMOM rotation toggle switches modes**
  - Given: Create Template → Add Block → Timed → EMOM
  - When: Click "Rotation" toggle in the config dialog
  - Then: Toggle switches from "Off" to "On", exercises section appears

- [ ] **Scenario 2: Workouts view tab switching**
  - Given: Navigate to Workouts view (bottom nav, dumbbell icon)
  - When: Tap "Benchmarks" tab at the top
  - Then: Tab becomes active (highlighted), benchmarks list appears (may be empty)
  - When: Tap "Templates" tab
  - Then: Tab becomes active, templates list appears

- [ ] Run `pnpm type-check && pnpm lint && pnpm test` - all pass
```

#### Test Plan Self-Check

Before creating the PR, verify your test plan:
- [ ] Can QA execute this without reading the code diff?
- [ ] Are all "verify" statements replaced with specific expected results?
- [ ] Does each scenario say WHERE in the app to start?
- [ ] Are button labels, tab names, and values exact (not paraphrased)?
- [ ] Is the prerequisites section filled in (including database state)?

### Step 4: Create the PR

Use `gh pr create` with a HEREDOC for proper formatting:

```bash
gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## Summary
- Key change 1
- Key change 2

## Test plan

**Prerequisites:**
- Run `pnpm dev` and open http://localhost:5173
- Database state: [empty / has sample data / doesn't matter]

- [ ] **Scenario 1: [Feature/behavior being tested]**
  - Given: [Starting state - where in the app, what's visible]
  - When: [Specific action - click, tap, type]
  - Then: [Expected result with exact text/values to verify]

- [ ] **Scenario 2: [Another behavior]**
  - Given: [Precondition]
  - When: [Action]
  - Then: [Result]

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
