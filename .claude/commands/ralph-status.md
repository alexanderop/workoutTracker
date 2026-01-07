---
description: Check Ralph PRD status and progress
allowed-tools: Read
model: Haiku
---

# Ralph Status

Show current Ralph Wiggum automation status.

<prd>
!`cat .ralph/ralph-prd.json 2>/dev/null || echo "No PRD found"`
</prd>

<progress>
!`cat .ralph/progress.txt 2>/dev/null || echo "No progress yet"`
</progress>

## Instructions

Summarize:
1. Total stories and their statuses (pending/done/blocked)
2. Current story being worked on (if any)
3. Recent progress highlights
4. Next recommended action
