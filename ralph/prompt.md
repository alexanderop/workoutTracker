# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

## First Steps

1. **Read `CLAUDE.md`** in the project root to understand:
   - Project stack and structure
   - Available commands (build, lint, test)
   - Code conventions and patterns

2. **Read `ralph/progress.txt`** for:
   - Learnings from previous iterations
   - Codebase patterns discovered
   - Gotchas to avoid

3. **Read `ralph/prd.json`** for the current PRD

## Your Task

1. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
2. Pick the **highest priority** user story where `passes: false`
3. Implement that single user story
4. Run quality checks (see CLAUDE.md for project-specific commands, typically lint + typecheck)
5. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
6. Update `ralph/prd.json` to set `passes: true` for the completed story
7. Append your progress to `ralph/progress.txt`

## Progress Report Format

APPEND to ralph/progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt:

```
## Codebase Patterns
- Example: How to query data in this project
- Example: Component naming conventions
- Example: File structure patterns
```

## Quality Requirements

Before committing:
1. Read CLAUDE.md for the project's lint/typecheck commands
2. Run those commands
3. Fix any errors before committing

- ALL commits must pass linting and type checks
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns in the codebase

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting
- Check CLAUDE.md for project conventions
- Do not skip verification steps in acceptance criteria
