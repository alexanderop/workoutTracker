---
description: Run tests with coverage and suggest integration tests to add
allowed-tools: Bash(pnpm test:coverage), Read, Glob, Grep
---

# Coverage Analysis

Running tests with coverage...

<coverage_output>
!`pnpm test:coverage 2>&1`
</coverage_output>

## Instructions

1. **Parse the coverage output** above to identify:
   - Files with low statement/branch/function coverage (below 80%)
   - Uncovered lines and branches

2. **Prioritize by impact**: Focus on files in `src/composables/` and `src/components/` that contain important business logic.

3. **Suggest integration tests** that would increase coverage meaningfully:
   - For each suggestion, explain:
     - Which file/function needs coverage
     - What user flow or scenario the test should cover
     - Expected coverage improvement
   - Prioritize tests that cover multiple uncovered branches in a single flow

4. **Format your response** as an actionable list the user can work through, ordered by coverage impact.

5. **Skip** files in:
   - `src/components/ui/` (shadcn primitives)
   - Generated files or type definitions
