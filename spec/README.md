# Ralph Wiggum Technique

Continuous AI loop for iterative task completion. Based on [Geoffrey Huntley's technique](https://ghuntley.com/ralph/).

## Quick Start

```bash
# 1. Create a task
/ralph-new

# 2. Run Ralph
./scripts/ralph.sh my-task-name 10
```

## Commands

| Command | Description |
|---------|-------------|
| `/ralph-new` | Create new task interactively (guided prompts) |
| `/ralph-spec` | Convert existing prompt.md to spec.json |
| `./scripts/ralph.sh` | Run loop (--print mode, fast) |
| `./scripts/ralph-interactive.sh` | Run loop with full tool access |

## Workflow

### 1. Create Task

```
/ralph-new
```

Prompts for:
- **Task name** (kebab-case, becomes folder name)
- **Goal** (what should be achieved)
- **Success criteria** (verifiable conditions)
- **Context** (constraints, relevant info)

Creates `spec/task/<name>/` with:
```
spec/task/my-task/
├── prompt.md    # The prompt fed to Claude each iteration
├── spec.json    # Machine-readable spec
└── memory.md    # Learnings across iterations
```

### 2. Run Ralph

**Simple mode** (planning, analysis):
```bash
./scripts/ralph.sh my-task 10
```

**Interactive mode** (needs file edits, tests):
```bash
./scripts/ralph-interactive.sh my-task 10
```

Arguments:
- `my-task` - task name or path to prompt.md
- `10` - max iterations (0 = infinite)

### 3. Completion

Ralph stops when:
- Claude outputs `<promise>DONE</promise>`
- Max iterations reached
- You press Ctrl+C

## How It Works

```
┌─────────────────────────────────────────────┐
│  while :; do                                │
│    cat prompt.md | claude                   │
│    # Claude sees previous work in files     │
│    # Iterates toward completion             │
│  done                                       │
└─────────────────────────────────────────────┘
```

Each iteration:
1. Same prompt fed to Claude
2. Claude reads codebase, sees previous work
3. Makes progress toward goal
4. Updates memory.md with learnings
5. Outputs `<promise>DONE</promise>` when complete

## Writing Good Prompts

### Include Clear Success Criteria

```markdown
## Success Criteria
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Feature works on mobile
```

### Add Completion Signal

```markdown
## Completion Signal
When ALL criteria are met, output:
<promise>DONE</promise>
```

### Provide Context

```markdown
## Context
- Uses Vue 3 Composition API
- State managed with createGlobalState()
- Tests use Vitest browser mode
```

## Example Task

**Goal:** Add dark mode toggle

```bash
/ralph-new
# name: add-dark-mode
# goal: Add dark mode toggle to settings with system preference detection
# criteria:
#   - Toggle persists across sessions
#   - Respects system preference on first visit
#   - All existing tests pass
# context: Uses Tailwind CSS, theme stored in localStorage

./scripts/ralph-interactive.sh add-dark-mode 15
```

## Tips

1. **Start with max-iterations** - Safety net while learning
2. **Tune prompts on failure** - Add "signs" (constraints, warnings)
3. **Check memory.md** - See what Ralph learned across iterations
4. **Use spec.json status** - Track task state programmatically

## File Locations

| Path | Purpose |
|------|---------|
| `spec/task/` | All Ralph tasks |
| `spec/task/.template/` | Templates for new tasks |
| `scripts/ralph.sh` | Simple loop script |
| `scripts/ralph-interactive.sh` | Full tool access script |
| `.claude/skills/ralph-new/` | Task creation skill |
| `.claude/skills/ralph-spec/` | Prompt→JSON converter |

## Gitignore

These are ignored (local state):
- `PROMPT.md` (root level)
- `.ralph-log-*`
- `spec/task/**/memory.md`
