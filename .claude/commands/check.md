---
description: Review current changes with parallel subagents
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git status), Task
---

# Code Review

Review the current changes using our specialized review agents.

<git_status>
!`git status`
</git_status>

<changed_files>
!`git diff --name-only HEAD`
</changed_files>

<staged_diff>
!`git diff --cached`
</staged_diff>

<unstaged_diff>
!`git diff`
</unstaged_diff>

## Instructions

Launch **3 Task tools in parallel** (single message, multiple tool calls) with these subagent types:

### 1. Fowler Refactoring Reviewer
```
subagent_type: fowler-refactoring-reviewer
prompt: |
  Review the following code changes for refactoring opportunities using Martin Fowler's methodology.

  Changed files: [list from <changed_files>]

  Diff:
  [include relevant diffs from <staged_diff> and <unstaged_diff>]

  Focus on: code smells, refactoring opportunities, technical debt reduction.
  Return: Prioritized list of issues with specific refactoring suggestions.
```

### 2. Vue Component Reviewer
```
subagent_type: vue-reviewer
prompt: |
  Review the following Vue component changes for readability improvements.

  Changed Vue files: [filter .vue files from <changed_files>]

  Diff:
  [include Vue file diffs from <staged_diff> and <unstaged_diff>]

  Focus on: component patterns, composable usage, template readability.
  Return: Pattern violations with impact ratings and refactoring suggestions.
```

### 3. Test Reviewer
```
subagent_type: kcd-test-reviewer
prompt: |
  Review the following test changes using Kent C. Dodds' testing philosophy.

  Changed test files: [filter .spec.ts/.test.ts files from <changed_files>]

  Diff:
  [include test file diffs from <staged_diff> and <unstaged_diff>]

  Focus on: Testing Trophy adherence, query priority, avoiding implementation details.
  Return: Test quality issues with suggestions for improving test confidence.
```

## After All Agents Complete

Compile the results into a single report:

```markdown
# Code Review Report

## Summary
[Brief overview of findings across all reviewers]

## Refactoring Opportunities (Fowler)
[Issues ordered by priority]

## Vue Component Issues
[Pattern violations with impact ratings]

## Test Quality
[Test improvements needed]

## Recommended Actions
[Top 3-5 actionable items to address before committing]
```

If a reviewer finds no issues, note that section passes review.
