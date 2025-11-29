---
description: Run ESLint and fix any issues found
allowed-tools: Bash(pnpm lint:*), Bash(pnpm eslint:*), Read, Edit, Glob
model: haiku
---

# Lint and Fix

I have run ESLint on your codebase. Here are the results:

<eslint_output>
!`pnpm lint:eslint 2>&1`
</eslint_output>

## Instructions

### Step 1: Analyze the output

1. **Review the ESLint output** above to identify all errors and warnings.
2. **Group issues by file** to fix them efficiently.
3. **Prioritize errors over warnings** - errors must be fixed first.

### Step 2: Fix the issues

For each file with issues:

1. **Read the file** to understand the context around the error.
2. **Apply the fix** using the Edit tool.
3. **Follow the project's TypeScript Style Guide** when making fixes:
   - Use `type` over `interface`
   - Use `unknown` instead of `any`
   - Prefer inference over explicit types
   - Use discriminated unions for complex state

### Step 3: Verify fixes

After fixing all issues, run ESLint again to confirm all issues are resolved:

```bash
pnpm lint:eslint
```

If new issues appear, repeat the fix process until the linter passes cleanly.
