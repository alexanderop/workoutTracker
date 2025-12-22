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

Launch a single orchestrator agent (`general-purpose`) with the git context above. The orchestrator will:

1. Determine review mode (uncommitted vs branch changes)
2. Select 2-4 relevant reviewers
3. Launch them in parallel
4. Compile a unified report

Use this prompt (substitute the actual values from the git context above):

```
subagent_type: general-purpose
prompt: |
  You are a code review orchestrator. Analyze the changes and coordinate specialized reviewers.

  ## Git Context

  Current branch: [value from <current_branch>]

  Changed files:
  [value from <uncommitted_changed_files> if uncommitted changes exist, else <branch_changed_files>]

  Diff to review:
  [value from <staged_diff> + <unstaged_diff> if uncommitted changes exist, else <branch_diff>]

  ## Your Tasks

  ### 1. Determine Review Mode

  - If staged/unstaged diff is not empty: Review uncommitted changes
  - Else if on branch other than main: Review branch changes vs main
  - Else: Report nothing to review and stop

  ### 2. Select Reviewers (2-4 based on relevance)

  | Reviewer | Use When |
  |----------|----------|
  | vue-reviewer | `.vue` files changed |
  | typescript-reviewer | Complex types, generics, type assertions |
  | kcd-test-reviewer | `.spec.ts` or `.test.ts` files |
  | accessibility-reviewer | UI: buttons, inputs, modals, forms |
  | performance-reviewer | Reactivity, computed/watch, large lists |
  | architecture-reviewer | Cross-feature imports, new feature files |
  | security-reviewer | User input, v-html, external data |
  | vueuse-reviewer | Manual listeners, localStorage, timers |
  | fowler-refactoring-reviewer | Large functions, duplication |

  Rules:
  - Include vue-reviewer if any `.vue` files changed
  - Include kcd-test-reviewer if any test files changed
  - Pick remaining by diff content

  ### 3. Launch Reviewers in Parallel

  Launch 2-4 Task tools in a **single message**:

  ```
  subagent_type: [reviewer-type]
  prompt: |
    Review the following changes.

    Changed files: [file list]
    Diff: [relevant diff]
    Focus: [from table below]
  ```

  | Reviewer | Focus | Output |
  |----------|-------|--------|
  | vue-reviewer | Component patterns, composables, templates | Violations with impact |
  | typescript-reviewer | No `any`, proper generics | Type issues with severity |
  | kcd-test-reviewer | Testing Trophy, query priority | Test quality issues |
  | accessibility-reviewer | ARIA, keyboard nav, focus | WCAG violations |
  | performance-reviewer | Reactivity efficiency | Performance issues |
  | architecture-reviewer | Feature isolation | Boundary violations |
  | security-reviewer | XSS, injection, validation | OWASP issues |
  | vueuse-reviewer | VueUse opportunities | Code reduction |
  | fowler-refactoring-reviewer | Code smells | Prioritized suggestions |

  ### 4. Compile Final Report

  ```markdown
  # Code Review Report

  ## Review Mode
  [Uncommitted OR branch changes]

  ## Reviewers Selected
  [List and why]

  ## Summary
  [2-3 sentences]

  ## Critical Issues
  [Must fix - or "None"]

  ## [Reviewer Name]
  [Findings or "No issues"]

  ...

  ## Recommended Actions
  1. [Priority actions]
  ```
```
