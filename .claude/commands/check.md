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

Launch **8 Task tools in parallel** (single message, multiple tool calls) with these subagent types:

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

### 4. TypeScript Reviewer
```
subagent_type: typescript-reviewer
prompt: |
  Review the following code changes for TypeScript strict mode compliance.

  Changed files: [filter .ts/.vue files from <changed_files>]

  Diff:
  [include relevant diffs from <staged_diff> and <unstaged_diff>]

  Focus on: no `any`, no type assertions, proper generics, discriminated unions.
  Return: Type safety violations with severity and fixes.
```

### 5. Accessibility Reviewer
```
subagent_type: accessibility-reviewer
prompt: |
  Review the following Vue component changes for accessibility issues.

  Changed Vue files: [filter .vue files from <changed_files>]

  Diff:
  [include Vue file diffs from <staged_diff> and <unstaged_diff>]

  Focus on: ARIA attributes, keyboard navigation, focus management, touch targets.
  Return: WCAG violations with severity and fixes.
```

### 6. Performance Reviewer
```
subagent_type: performance-reviewer
prompt: |
  Review the following code changes for performance issues.

  Changed files: [list from <changed_files>]

  Diff:
  [include relevant diffs from <staged_diff> and <unstaged_diff>]

  Focus on: reactivity efficiency, shallowRef usage, computed vs method, memory leaks.
  Return: Performance issues with impact assessment and optimizations.
```

### 7. Architecture Reviewer
```
subagent_type: architecture-reviewer
prompt: |
  Review the following code changes for architecture boundary violations.

  Changed files: [list from <changed_files>]

  Diff:
  [include relevant diffs from <staged_diff> and <unstaged_diff>]

  Focus on: feature isolation, dependency direction, layer violations.
  Return: Architecture violations with severity and refactoring suggestions.
```

### 8. Security Reviewer
```
subagent_type: security-reviewer
prompt: |
  Review the following code changes for security vulnerabilities.

  Changed files: [list from <changed_files>]

  Diff:
  [include relevant diffs from <staged_diff> and <unstaged_diff>]

  Focus on: XSS, injection, data validation, sensitive data exposure.
  Return: Security vulnerabilities with OWASP category and fixes.
```

## After All Agents Complete

Compile the results into a single report:

```markdown
# Code Review Report

## Summary
[Brief overview of findings across all 8 reviewers]

## Critical Issues
[Any high-severity items that must be fixed before committing]

## Refactoring Opportunities (Fowler)
[Code smells and refactoring suggestions]

## Vue Component Issues
[Pattern violations with impact ratings]

## Test Quality
[Test improvements needed]

## TypeScript
[Type safety violations]

## Accessibility
[WCAG violations and a11y issues]

## Performance
[Reactivity and optimization issues]

## Architecture
[Boundary violations and layering issues]

## Security
[Vulnerabilities with OWASP categories]

## Recommended Actions
[Top 5 actionable items to address before committing, ordered by priority]
```

If a reviewer finds no issues, note that section passes review.
