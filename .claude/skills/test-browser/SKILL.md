---
name: test-browser
description: Smoke-test affected pages in a real browser via the agent-browser CLI by mapping changed files to routes. Use when the user says "test in the browser", "smoke test the PR", "verify the UI works", or before merging UI-affecting changes.
argument-hint: "[PR number, branch name, 'current', or --port PORT]"
---

# Browser Test Skill

Run end-to-end browser tests on pages affected by a PR or branch changes using the `agent-browser` CLI.

## Use `agent-browser` Only For Browser Automation

This workflow uses the `agent-browser` CLI exclusively. Do not use any alternative browser automation system, browser MCP integration, or built-in browser-control tool. If the platform offers multiple ways to control a browser, always choose `agent-browser`.

Use `agent-browser` for: opening pages, clicking elements, filling forms, taking screenshots, and scraping rendered content.

Platform-specific hints:
- In Claude Code, do not use Chrome MCP tools (`mcp__claude-in-chrome__*`).
- In Codex, do not substitute unrelated browsing tools.

## Prerequisites

- Local development server running (e.g., `bin/dev`, `rails server`, `npm run dev`)
- `agent-browser` CLI installed (see Setup below)
- Git repository with changes to test

## Setup

Check whether `agent-browser` is installed:

```bash
command -v agent-browser >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTALLED"
```

If not installed, inform the user: "`agent-browser` is not installed. Run `/ce-setup` to install required dependencies." Then stop — this skill cannot function without agent-browser.

## Workflow

### 1. Verify Installation

Before starting, verify `agent-browser` is available:

```bash
command -v agent-browser >/dev/null 2>&1 && echo "Ready" || echo "NOT INSTALLED"
```

If not installed, inform the user and stop.

### 2. Ask Browser Mode

Ask the user whether to run headed or headless:

```
Do you want to watch the browser tests run?

1. Headed (watch) - Opens visible browser window so you can see tests run
2. Headless (faster) - Runs in background, faster but invisible
```

Store the choice and use the `--headed` flag when the user selects option 1.

### 3. Determine Test Scope

**If PR number provided:**
```bash
gh pr view [number] --json files -q '.files[].path'
```

**If 'current' or empty:**
```bash
git diff --name-only main...HEAD
```

**If branch name provided:**
```bash
git diff --name-only main...[branch]
```

### 4. Map Files to Routes

Map changed files to testable routes:

| File Pattern | Route(s) |
|-------------|----------|
| `src/app/*` (Next.js) | Corresponding routes |
| `src/components/*` | Pages using those components |
| `src/features/*` | Feature-related pages |
| `src/views/*` | Corresponding routes |

### 5. Detect Dev Server Port

Determine the dev server port using this priority:

1. **Explicit argument** — if the user passed `--port 5000`, use that directly
2. **Project instructions** — check `CLAUDE.md` for port references
3. **package.json** — check dev/start scripts for `--port` flags
4. **Environment files** — check `.env`, `.env.local`, `.env.development` for `PORT=`
5. **Default** — fall back to `3000`

### 6. Verify Server is Running

```bash
agent-browser open http://localhost:${PORT}
agent-browser snapshot -i
```

### 7. Test Each Affected Page

For each affected route:

```bash
agent-browser open "http://localhost:${PORT}/[route]"
agent-browser snapshot -i
```

Verify key elements:
- Page title/heading present
- Primary content rendered
- No error messages visible

### 8. Handle Failures

Screenshot errors and ask the user how to proceed (fix now, create todo, or skip).

### 9. Test Summary

Present a markdown summary of pages tested, failures, and result (PASS/FAIL/PARTIAL).

## agent-browser CLI Reference

```bash
agent-browser open <url>           # Navigate to URL
agent-browser snapshot -i          # Interactive elements with refs
agent-browser click @e1            # Click element
agent-browser fill @e1 "text"      # Fill input
agent-browser screenshot out.png   # Screenshot
agent-browser --headed open <url>  # Headed mode
```
