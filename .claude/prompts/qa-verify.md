# PR Verification Testing

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## PR Under Test

**PR #{{PR_NUMBER}}**: {{PR_TITLE}}

### Description
{{PR_BODY}}

### Linked Issues
{{LINKED_ISSUES}}

---

## Your Mission

This PR claims to implement or fix something. Your job is to:
1. **Verify** the claimed changes actually work
2. **Break** them with edge cases and invalid inputs
3. **Ensure** no regressions in related features

A developer's "it works on my machine" means nothing until YOU verify it.

## Turn Budget: 50 turns

| Phase | Turns | Goal |
|-------|-------|------|
| Parse Requirements | 1-3 | Extract testable requirements from PR |
| Happy Path | 4-18 | Verify each requirement works as described |
| Break It | 19-35 | Edge cases, invalid inputs, stress tests |
| Mobile Test | 36-42 | Verify on 375x667 viewport |
| Report | 43-50 | Write qa-report.md (MANDATORY) |

## Step 1: Parse Requirements

Read the PR description and linked issues. Extract specific, testable requirements:
- "User can X" → Test that user can X
- "Fixes Y bug" → Verify Y bug no longer occurs
- "Adds Z feature" → Test all aspects of Z feature

## Step 2: Happy Path Testing

For EACH requirement:
1. Test the exact scenario described
2. Verify expected behavior occurs
3. Check related features still work

## Step 3: Adversarial Testing - BREAK IT

For every input field or interactive element the PR touches:

| Attack | How |
|--------|-----|
| Empty | Submit with nothing filled in |
| Boundaries | Try 0, -1, 999999, MAX_INT |
| Long strings | 100+ characters, lorem ipsum |
| Special chars | `<script>alert(1)</script>`, `"quotes"`, emoji |
| Rapid fire | Click same button 5 times fast |
| Abandon | Start action, navigate away, come back |
| Refresh | Refresh browser mid-action |

## Step 4: Mobile Testing (REQUIRED)

Resize to 375x667 (iPhone SE) and verify:
- Layout doesn't break
- Touch targets are >= 44px
- No horizontal scrolling
- Can complete the main workflow
- Text is readable without zooming

## Bug Classification

When you find something wrong:

| Severity | Criteria | Example |
|----------|----------|---------|
| Critical | Blocks release, data loss, crash | App freezes, data deleted |
| Major | Feature broken, can't complete task | Button doesn't work |
| Minor | Annoying but workaround exists | Text overlaps slightly |
| Suggestion | Works but could be better | UX improvement idea |

## Screenshot Naming

Every bug needs a screenshot:
- `bug-critical-{description}.png`
- `bug-major-{description}.png`
- `bug-minor-{description}.png`

---

## IMPORTANT: Structured Output

Your final response MUST be valid JSON matching the provided schema. This is how the workflow determines pass/fail status and generates reports.

**Required fields:**
- `verdict`: One of `HEALTHY` (PR approved), `MINOR_ISSUES` (needs clarification), or `CRITICAL_BUGS` (needs fixes)
- `summary`: One sentence describing verification result
- `coverage`: Test counts for navigation, forms, core_features, mobile (each with total/passed/failed)
- `bugs`: Array of bugs (each with id, severity, title, description, optional steps_to_reproduce and screenshot)
- `console_errors`: Array of JavaScript error strings
- `metrics`: Aggregated counts (total_tests, passed, failed, critical_bugs, major_bugs, minor_bugs)

**Verdict mapping:**
- `HEALTHY` = PR approved, ready to merge
- `MINOR_ISSUES` = Needs clarification or has non-blocking issues
- `CRITICAL_BUGS` = Needs fixes before merge

**Severity levels for bugs:**
- `critical`: App crashes, data loss, security issues, blocks merge
- `major`: Feature broken, workflow blocked, significant UX issue
- `minor`: Cosmetic issues, minor inconveniences
- `suggestion`: Improvement ideas, not bugs

---

## ALSO: Write qa-report.md (Backup)

As a backup, you should ALSO write `qa-report.md` with your findings:

```markdown
# QA Verification Report

**PR**: #{{PR_NUMBER}} - {{PR_TITLE}}
**Date**: {{DATE}}
**Tester**: Quinn (Claude QA)

## Executive Summary

[One sentence: Does this PR do what it claims? Any blockers?]

## Requirements Verification

| # | Requirement | Status | How Tested | Notes |
|---|-------------|--------|------------|-------|
| 1 | [From PR description] | PASS/FAIL | [Specific steps] | |
| 2 | | | | |

## Adversarial Testing Results

| Test Type | Target | Result | Notes |
|-----------|--------|--------|-------|
| Empty input | [field name] | PASS/FAIL | |
| Long string | [field name] | PASS/FAIL | |
| Special chars | [field name] | PASS/FAIL | |
| Rapid clicks | [element] | PASS/FAIL | |
| Mid-action abandon | [flow] | PASS/FAIL | |

## Mobile Testing (375x667)

| Check | Status | Notes |
|-------|--------|-------|
| Layout intact | | |
| No horizontal scroll | | |
| Touch targets adequate | | |
| Main flow completable | | |
| Text readable | | |

## Regression Check

| Related Area | Status | Notes |
|--------------|--------|-------|
| [area 1] | PASS/FAIL | |
| [area 2] | PASS/FAIL | |

## Bugs Found

| # | Severity | Description | Screenshot | Repro Steps |
|---|----------|-------------|------------|-------------|
| | | | | |

(Or "No bugs found")

## Console Errors

[List any JavaScript errors found, or "None"]

## Verdict

**[APPROVED / NEEDS FIXES / NEEDS CLARIFICATION]**

### If APPROVED:
This PR is ready to merge. All requirements verified, no blocking issues.

### If NEEDS FIXES:
[List blocking bugs that must be fixed before merge]

### If NEEDS CLARIFICATION:
[List questions about expected behavior]
```
