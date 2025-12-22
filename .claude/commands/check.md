---
description: Review current changes with parallel subagents
allowed-tools: Bash(git diff:*), Bash(git status), Bash(git branch:*), Bash(git merge-base:*), Task
---

# Code Review

Review current changes using specialized review agents.

<git_status>
!`git status`
</git_status>

<current_branch>
!`git branch --show-current`
</current_branch>

<merge_base>
!`git merge-base main HEAD 2>/dev/null || echo ""`
</merge_base>

<branch_changed_files>
!`git diff --name-only main...HEAD 2>/dev/null || echo ""`
</branch_changed_files>

<branch_diff>
!`git diff main...HEAD 2>/dev/null || echo ""`
</branch_diff>

<uncommitted_changed_files>
!`git diff --name-only HEAD`
</uncommitted_changed_files>

<staged_diff>
!`git diff --cached`
</staged_diff>

<unstaged_diff>
!`git diff`
</unstaged_diff>

## Instructions

### Step 1: Analyze Changes

Determine review mode:
- **Uncommitted changes**: If `<staged_diff>` or `<unstaged_diff>` have content
- **Branch changes**: Otherwise use `<branch_diff>`

### Step 2: Select Reviewers

Based on changed files and diff content, select 2-4 reviewers:

| Reviewer | Select When |
|----------|-------------|
| vue-reviewer | Any `.vue` files |
| typescript-reviewer | Complex types, generics, type assertions |
| kcd-test-reviewer | Any `.spec.ts` or `.test.ts` files |
| accessibility-reviewer | UI elements: buttons, inputs, modals, forms |
| performance-reviewer | Reactivity patterns, computed/watch, large lists |
| architecture-reviewer | Cross-feature imports, new feature files |
| security-reviewer | User input handling, v-html, external data |
| vueuse-reviewer | Manual event listeners, localStorage, timers |
| fowler-refactoring-reviewer | Large functions, code duplication |

### Step 3: Launch Reviewers in Parallel

Launch 2-4 Task tools in a **single message** with all selected reviewers at once. Each reviewer prompt should include the changed files list and the relevant diff.

### Step 4: Compile Report

After all reviewers complete, compile findings into:

```markdown
# Code Review Report

## Summary
[2-3 sentences]

## Critical Issues
[Must fix - or "None"]

## [Reviewer Name]
[Findings or "No issues"]

## Recommended Actions
1. [Priority actions]
```
