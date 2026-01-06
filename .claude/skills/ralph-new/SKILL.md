---
name: ralph-new
description: Create a new Ralph task with guided prompts. Generates prompt.md, spec.json, and memory.md in spec/task/<task-name>/
---

# Ralph Task Generator

## Overview

Interactively create a new Ralph Wiggum task specification with all required files.

**Announce at start:** "I'll help you create a new Ralph task specification."

## Process

### Step 1: Gather Task Information

Use AskUserQuestion to collect information in this order:

**Question 1: Task Name**
```
What should this task be called?
(Will be used as folder name, e.g., "add-dark-mode" → spec/task/add-dark-mode/)
```
Free text input - ask user to provide a kebab-case name.

**Question 2: Goal**
```
What is the main goal of this task?
Describe what should be achieved when complete.
```

**Question 3: Success Criteria**
```
What are the success criteria? (List each criterion)
Examples:
- All tests pass
- Feature works in mobile view
- No TypeScript errors
```
Collect as a list.

**Question 4: Context**
```
Any relevant context about the codebase or constraints?
Examples:
- Uses Vue 3 Composition API
- Must work with existing auth system
- Performance critical
```

### Step 2: Create Task Folder

```bash
TASK_NAME="<user-provided-name>"
TASK_DIR="spec/task/$TASK_NAME"
mkdir -p "$TASK_DIR"
```

### Step 3: Generate Files

Create three files from templates:

#### prompt.md
```markdown
# Task: <TASK_NAME>

## Goal
<GOAL>

## Success Criteria
- [ ] <CRITERION_1>
- [ ] <CRITERION_2>
...

## Context
<CONTEXT>

## Instructions
1. Read memory.md to understand previous progress and learnings
2. Check your work in the codebase from previous iterations
3. Continue from where you left off
4. After each significant change, update memory.md with learnings
5. When ALL success criteria are met, output: <promise>DONE</promise>

## Completion Signal
When the task is complete, you MUST output exactly:
<promise>DONE</promise>
```

#### spec.json
```json
{
  "name": "<TASK_NAME>",
  "goal": "<GOAL>",
  "success_criteria": ["<CRITERION_1>", "<CRITERION_2>"],
  "context": "<CONTEXT>",
  "instructions": [
    "Read memory.md to understand previous progress",
    "Check codebase for previous iteration work",
    "Continue from where you left off",
    "Update memory.md with learnings after significant changes",
    "Output <promise>DONE</promise> when all criteria met"
  ],
  "created_at": "<ISO_TIMESTAMP>",
  "status": "pending"
}
```

#### memory.md
```markdown
# Memory: <TASK_NAME>

## Progress
- [ ] Task started

## Learnings
<!-- Add learnings from each iteration here -->

## Blockers
<!-- Document any blockers encountered -->

## Decisions
<!-- Record important decisions made during iterations -->
```

### Step 4: Report Success

```
Created Ralph task: spec/task/<TASK_NAME>/
├── prompt.md   (feed to Ralph)
├── spec.json   (machine-readable spec)
└── memory.md   (iteration learnings)

To run:
  ./scripts/ralph.sh spec/task/<TASK_NAME>/prompt.md 10
```

## Example Interaction

```
User: /ralph-new

Claude: I'll help you create a new Ralph task specification.

What should this task be called? (kebab-case, e.g., "add-dark-mode")

User: refactor-auth-flow

Claude: What is the main goal of this task?

User: Refactor the authentication flow to use JWT tokens instead of session cookies

Claude: What are the success criteria? List each one:

User:
- JWT tokens issued on login
- Refresh token rotation works
- All auth tests pass
- No session cookies used

Claude: Any relevant context about constraints?

User: Must maintain backwards compatibility with existing API

Claude:
Created Ralph task: spec/task/refactor-auth-flow/
├── prompt.md
├── spec.json
└── memory.md

To run:
  ./scripts/ralph.sh spec/task/refactor-auth-flow/prompt.md 10
```

## Notes

- Task names should be kebab-case
- Success criteria should be specific and verifiable
- The memory.md file persists learnings across Ralph iterations
- spec.json enables programmatic task management
