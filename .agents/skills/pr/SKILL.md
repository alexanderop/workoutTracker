---
name: pr
description: Generate or update a structured pull request with summary, user impact, acceptance criteria, QA scope, risk areas, and executable test scenarios, then open it with GitHub CLI.
allowed-tools: Bash(git status) Bash(git diff:*) Bash(git log:*) Bash(git rev-parse:*) Bash(git remote:*) Bash(git push:*) Bash(gh pr:*) Bash(gh api:*)
---

# Structured Pull Request

Create or update a pull request from the current branch using the repo's QA-oriented PR contract.

## Live branch context

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
!`gh pr view --json number,title,url,state,body 2>/dev/null || echo "No existing PR"`
</existing_pr>

## Additional resources

- PR body template: [references/template.md](references/template.md)

## Instructions

### 1. Validate branch readiness

- If there are uncommitted changes, tell the user exactly which files are still dirty and ask whether to continue.
- If the current branch is `main` or the default branch, stop and ask the user to switch branches first.

### 2. Push the branch if needed

- Ensure the current branch exists on `origin`.
- Use `git push -u origin <current-branch>` when no upstream exists, otherwise `git push origin <current-branch>`.

### 3. Infer the PR intent

- Review all commits on the branch and the full diff, not just the latest commit.
- Derive the user-visible behavior change first. Separate implementation detail from product behavior.
- If intent is ambiguous or the branch mixes unrelated changes, ask the user for a short clarification before creating or updating the PR.

### 4. Produce a structured PR title and body

- Generate a conventional-commit style PR title:
  - `feat(scope): description`
  - `fix(scope): description`
  - `refactor(scope): description`
  - `docs(scope): description`
  - `test(scope): description`
  - `chore(scope): description`
- Use [references/template.md](references/template.md) as the required body shape.
- Fill every section. Do not omit headers.

#### Body requirements

- `Summary`: 2-4 bullets focused on what changed.
- `User Impact`: who is affected and what behavior changes for them.
- `Acceptance Criteria`: 3-5 explicit, testable user-facing outcomes. Write them as checkbox bullets starting with "User can..." or equivalent concrete behavior.
- `QA Scope`: keep this narrow and time-boxed. Default to verifying changed flows plus one adjacent regression path within 5-8 minutes.
- `Risk Areas`: 2-4 bullets naming the most likely breakage zones.
- `Manual Test Scenarios`: executable by QA without reading the diff. Use numbered scenarios with Given / When / Then and exact UI labels or results when possible.
- `CI Checks`: include `pnpm type-check`, `pnpm lint`, and `pnpm test`.

#### Quality bar for generated content

- Acceptance criteria must be specific enough for the browser QA workflow to verify directly from the PR body.
- Avoid vague phrases like "works correctly" or "verify changes".
- Prefer exact flows, labels, values, validation messages, and visible outcomes.
- If database or local state matters, say so in the scenario prerequisites.

### 5. Create or update the PR

- If a PR already exists for the branch, update its title/body instead of creating a duplicate.
- Otherwise create a new PR against the default branch.
- Use `gh pr create` or `gh pr edit` with a heredoc-style body to preserve formatting.

### 6. Show the result

- Return the PR number, title, and URL.
- If you had to make assumptions, list them briefly so the user can correct them before QA runs.
