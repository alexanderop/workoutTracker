---
description: Reset Ralph PRD and progress for a fresh start
allowed-tools: Bash(rm:*), Write
model: Haiku
---

# Ralph Reset

Reset Ralph Wiggum automation state for a fresh start.

## Instructions

1. Confirm with the user before proceeding
2. Remove `.ralph/ralph-prd.json`
3. Remove `.ralph/progress.txt`
4. Remove `.ralph/last-output.txt`
5. Confirm the reset is complete

```bash
rm -f .ralph/ralph-prd.json .ralph/progress.txt .ralph/last-output.txt
```

Tell the user to run `/ralph-plan <spec>` to create a new PRD.
