---
name: ralph-spec
description: Convert an existing prompt.md to spec.json format. Use when you have a prompt file and need the JSON spec generated.
---

# Ralph Spec Converter

## Overview

Converts an existing prompt.md file into the structured spec.json format.

**Announce at start:** "I'll convert your prompt to a JSON spec."

## Process

### Step 1: Get Prompt Location

If no argument provided, ask:
```
Which prompt file should I convert?
Enter path (e.g., spec/task/my-task/prompt.md or PROMPT.md)
```

### Step 2: Read and Parse Prompt

Read the prompt file and extract:
- **Task name**: From `# Task: <name>` header or filename
- **Goal**: From `## Goal` section
- **Success criteria**: From `## Success Criteria` section (parse checkboxes)
- **Context**: From `## Context` section
- **Instructions**: From `## Instructions` section (parse numbered list)

### Step 3: Generate spec.json

Create JSON structure:

```json
{
  "name": "<extracted-task-name>",
  "goal": "<extracted-goal>",
  "success_criteria": [
    "<criterion-1>",
    "<criterion-2>"
  ],
  "context": "<extracted-context>",
  "instructions": [
    "<instruction-1>",
    "<instruction-2>"
  ],
  "created_at": "<ISO-timestamp>",
  "status": "pending"
}
```

### Step 4: Write Output

Determine output location:
- If prompt is in `spec/task/<name>/prompt.md` → write to same folder as `spec.json`
- If prompt is standalone (e.g., `PROMPT.md`) → write to `spec.json` in same directory

### Step 5: Report

```
Converted: <prompt-path>
Output: <spec-json-path>

Extracted:
- Goal: <first-50-chars>...
- Criteria: <count> items
- Instructions: <count> steps
```

## Parsing Rules

### Goal Section
Extract text between `## Goal` and next `##` header.

### Success Criteria
Parse lines starting with `- [ ]` or `- [x]` or just `-`:
```markdown
## Success Criteria
- [ ] Tests pass        → "Tests pass"
- [x] Linting clean     → "Linting clean"
- No errors             → "No errors"
```

### Context Section
Extract text between `## Context` and next `##` header.
If empty or missing, use empty string.

### Instructions
Parse numbered list:
```markdown
## Instructions
1. First step           → "First step"
2. Second step          → "Second step"
```

## Example

**Input (prompt.md):**
```markdown
# Task: add-dark-mode

## Goal
Add dark mode toggle to settings page

## Success Criteria
- [ ] Toggle component works
- [ ] Theme persists across sessions
- [ ] All tests pass

## Context
Uses Tailwind CSS with CSS variables for theming.

## Instructions
1. Create toggle component
2. Add theme store
3. Update CSS variables
4. Test persistence
```

**Output (spec.json):**
```json
{
  "name": "add-dark-mode",
  "goal": "Add dark mode toggle to settings page",
  "success_criteria": [
    "Toggle component works",
    "Theme persists across sessions",
    "All tests pass"
  ],
  "context": "Uses Tailwind CSS with CSS variables for theming.",
  "instructions": [
    "Create toggle component",
    "Add theme store",
    "Update CSS variables",
    "Test persistence"
  ],
  "created_at": "2026-01-06T12:00:00Z",
  "status": "pending"
}
```

## Error Handling

- **File not found**: Report error, suggest checking path
- **Missing sections**: Use empty string/array, warn user
- **Malformed markdown**: Best-effort parsing, report what couldn't be extracted
