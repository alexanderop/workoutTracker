---
description: Run Ralph Wiggum long-running automation
allowed-tools: Read, Write, Bash(*), Glob, Grep, Edit, Task, TodoWrite
---

# Ralph Wiggum Automation

Run the Ralph Wiggum automation loop that works through PRD user stories.

## Parameters

$ARGUMENTS

Expected format: `<spec_file> <prd_file>`
- `spec_file`: Path to the original spec/requirements document
- `prd_file`: Path to the PRD JSON file with user stories

## Input Files

<spec_content>
!`cat $1 2>/dev/null || echo "No spec file provided or file not found"`
</spec_content>

<prd_content>
!`cat $2 2>/dev/null || echo "No PRD file provided or file not found"`
</prd_content>

<recent_progress>
!`tail -30 .ralph/progress.txt 2>/dev/null || echo "No progress yet"`
</recent_progress>

## Instructions

1. Validate that both spec and PRD files are provided and readable
2. If either file is missing, show an error and explain the expected format
3. Parse the PRD JSON and identify pending stories
4. For each pending story (highest priority first):
   - Read the relevant context from the spec
   - Implement the story following acceptance criteria
   - Run tests: `pnpm test`
   - Run type-check: `pnpm type-check`
   - Run lint: `pnpm lint`
   - If all pass, commit with conventional commit message
   - Update story status in PRD to "completed"
   - Log progress to `.ralph/progress.txt`
5. Continue until all stories are completed or blocked

## Workflow per Story

1. **Understand**: Read spec context + story requirements
2. **Plan**: Break into small implementation steps
3. **Implement**: Make changes incrementally
4. **Verify**: Run `pnpm type-check && pnpm lint && pnpm test`
5. **Commit**: `git add . && git commit -m "feat(<scope>): <description>"`
6. **Update PRD**: Mark story as completed
7. **Log**: Append to progress.txt

## Exit Conditions

- All stories completed → output `<promise>COMPLETE</promise>`
- Story blocked/unclear → mark as "blocked", add notes, continue to next
- Critical failure → stop and report
