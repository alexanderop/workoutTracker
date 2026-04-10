# Playwright CLI QA Pattern

Run exploratory QA tests using Claude Code in pipe mode (`claude -p`) with `@playwright/cli` for browser automation.

## Prerequisites

- Node.js 22+
- `@playwright/cli` (used via `npx`, no install needed)
- Dev server running on `http://localhost:5173`

## Quick Start

```bash
# 1. Start the dev server
pnpm dev

# 2. Run QA test
cat .claude/prompts/qa-cli-explore.md | claude -p \
  --max-turns 20 \
  --allowedTools 'Bash' 'Write'
```

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────┐
│  claude -p   │────>│  Bash tool    │────>│  playwright-cli    │
│  (pipe mode) │     │  (allowed)    │     │  (browser control) │
└─────────────┘     └──────────────┘     └────────────────────┘
       │                                          │
       │  prompt: "test the app"                  │  open, snapshot,
       │  --max-turns 20                          │  click, type,
       │  --allowedTools 'Bash' 'Write'           │  console, resize
       │                                          │
       ▼                                          ▼
┌─────────────┐                          ┌────────────────────┐
│  QA Report   │                          │  Running App       │
│  (stdout or  │                          │  localhost:5173     │
│   file)      │                          └────────────────────┘
└─────────────┘
```

## `claude -p` Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `-p` / `--print` | Non-interactive mode, output to stdout | `claude -p "prompt"` |
| `--max-turns N` | Limit agentic loops | `--max-turns 20` |
| `--allowedTools` | Whitelist tools (space-separated) | `--allowedTools 'Bash' 'Write'` |
| `--output-format json` | JSON output | `--output-format json` |
| `--json-schema '...'` | Structured output with validation | `--json-schema '{"type":"object",...}'` |

## `playwright-cli` Commands

The CLI uses ref-based element targeting. After each command, a YAML snapshot is returned with element refs (e.g., `e15`, `e21`).

```bash
# Browser lifecycle
npx @playwright/cli open http://localhost:5173
npx @playwright/cli close

# Page interaction
npx @playwright/cli snapshot              # get page structure + refs
npx @playwright/cli click e15             # click element by ref
npx @playwright/cli type "search text"    # type into focused element
npx @playwright/cli fill e5 "value"       # fill input by ref
npx @playwright/cli press Enter           # keyboard press
npx @playwright/cli hover e4              # hover element

# Inspection
npx @playwright/cli console              # check JS console errors
npx @playwright/cli network              # list network requests
npx @playwright/cli screenshot           # take screenshot

# Viewport
npx @playwright/cli resize 375 667       # mobile viewport
npx @playwright/cli resize 1920 1080     # desktop viewport

# Navigation
npx @playwright/cli goto https://...     # navigate to URL
npx @playwright/cli go-back              # browser back
npx @playwright/cli reload               # refresh page
```

## Usage Patterns

### Minimal smoke test

```bash
echo 'Open http://localhost:5173 with playwright-cli, snapshot all pages, check console, report verdict.' \
  | claude -p --max-turns 10 --allowedTools 'Bash' 'Write'
```

### Full QA with structured output

```bash
cat .claude/prompts/qa-cli-explore.md | claude -p \
  --max-turns 30 \
  --allowedTools 'Bash' 'Write' \
  --json-schema "$(cat .github/schemas/qa-report-schema.json)"
```

### Verify a specific PR change

```bash
echo "Open http://localhost:5173. The PR adds a rest timer to workouts. \
Test: start workout, add exercise, complete a set, verify rest timer appears and counts down. \
Report verdict." \
  | claude -p --max-turns 20 --allowedTools 'Bash' 'Write'
```

### CI simulation (exactly what GitHub Actions runs)

```bash
pnpm dev &
sleep 5
cat .claude/prompts/qa-cli-explore.md | claude -p \
  --max-turns 30 \
  --allowedTools 'Bash' 'Write' \
  --json-schema "$(cat .github/schemas/qa-report-schema.json)" \
  --output-format json > qa-result.json
kill %1
```

## MCP vs CLI Comparison

| | MCP (`@playwright/mcp`) | CLI (`@playwright/cli`) |
|---|---|---|
| Token usage | ~114k per task | ~27k per task |
| Integration | MCP server config in `claude_args` | Bash commands |
| Tool calls | `mcp__playwright__browser_*` | `Bash(npx @playwright/cli ...)` |
| Works locally | Needs MCP config | Just `npx` |
| Skill support | No built-in | `playwright-cli install --skills` |
| GitHub Actions | `--mcp-config '{...}'` | `--allowedTools 'Bash' 'Write'` |

## Troubleshooting

**"command not found"**: Use `npx @playwright/cli` instead of `playwright-cli` directly.

**Browser install needed**: Run `npx @playwright/cli install-browser chromium` first.

**Permission denied in `claude -p`**: Use `--allowedTools 'Bash'` (not `'Bash(npx @playwright/cli:*)'` which has pattern matching issues).

**Version conflict with project's playwright**: Don't add `@playwright/cli` as a devDependency. Use `npx @playwright/cli@latest` which runs in isolation.
