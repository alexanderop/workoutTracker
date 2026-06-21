---
name: review-coderabbit
description: Fetch CodeRabbit review comments on the current PR, validate each against project conventions, implement valid fixes, and reply to resolve each conversation. Use proactively when CodeRabbit leaves review comments, or when the user says "review coderabbit", "address coderabbit feedback", or "fix coderabbit comments".
allowed-tools: Bash(gh pr view:*), Bash(gh api:*), Bash(git rev-parse:*), Bash(git status), Bash(pnpm type-check), Bash(pnpm lint), Task, Read, Edit, Glob, Grep, TodoWrite
---

# Review CodeRabbit Comments

I have gathered information about the current PR. Here are the results:

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<pr_info>
!`gh pr view --json number,title,url 2>/dev/null || echo "No PR found for current branch"`
</pr_info>

<coderabbit_review>
!`gh pr view --json reviews --jq '.reviews[] | select(.author.login == "coderabbitai") | .body' 2>/dev/null | head -500`
</coderabbit_review>

<coderabbit_comments>
!`gh api repos/{owner}/{repo}/pulls/$(gh pr view --json number -q .number)/comments --jq '.[] | select(.user.login == "coderabbitai") | {id: .id, path: .path, line: .line, body: (.body | split("\n")[0:3] | join("\n"))}' 2>/dev/null`
</coderabbit_comments>

## Instructions

### Step 1: Parse CodeRabbit Feedback

1. **Extract actionable comments** from the CodeRabbit review above
2. **Categorize** them into:
   - Code quality issues (type assertions, unclear code)
   - Accessibility issues (missing aria-labels, decorative icons)
   - Design system issues (inconsistent classes, hardcoded values)
   - Bug risks (type safety, null checks)

### Step 2: Validate Each Comment

For each substantive comment, **spawn a subagent** to analyze it in isolation:

```
Use Task tool with subagent_type="general-purpose" for each comment:
- Read the actual file and relevant context
- Check if the suggestion aligns with project conventions (AGENTS.md)
- Determine verdict: VALID, INVALID, or PARTIALLY VALID
- If partially valid, note what's correct and what's not
```

Launch multiple agents in parallel for efficiency.

### Step 3: Summarize Findings

Create a summary table:

| Comment | File | Verdict | Recommendation |
|---------|------|---------|----------------|
| ... | ... | ... | ... |

Categorize into:
- **Should fix** - Valid suggestions aligned with project guidelines
- **Skip** - Invalid or overly defensive suggestions
- **Needs decision** - Valid but requires user input on approach

### Step 4: Ask for Confirmation

Before implementing, ask the user:
> "I found X valid fixes to implement. Would you like me to proceed?"

### Step 5: Implement Valid Fixes

1. Create a todo list with all fixes
2. Read each file before editing
3. Make the edits
4. Run verification:
   ```bash
   pnpm type-check && pnpm lint
   ```

### Step 6: Resolve CodeRabbit Conversations

After implementing fixes, reply to each CodeRabbit comment to resolve the conversation:

**For FIXED comments** - Reply indicating the fix was applied:
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -f body="Fixed: [brief description of what was done]"
```

**For INVALID comments** - Reply explaining why it was already correct or not applicable:
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -f body="Already implemented: [explanation] / Not applicable: [reason]"
```

**For SKIPPED comments** - Reply explaining why it was intentionally skipped:
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -f body="Skipped: [reason - e.g., inconsistent with codebase patterns, over-defensive, etc.]"
```

Use the comment IDs from the `<coderabbit_comments>` section above.

### Project Guidelines Reference

Key rules from AGENTS.md to check against:
- NO `any`, `enum`, or type assertions (`as T`)
- Use `tryCatch()` from `@/lib/tryCatch` (not native try/catch)
- Use `RouteNames` from `@/router` (not string literals)
- Features cannot import other features
- shadcn-vue components in `src/components/ui/` must NOT be modified
- Vue 3.5+ APIs required (defineProps destructuring, defineModel, useTemplateRef)
