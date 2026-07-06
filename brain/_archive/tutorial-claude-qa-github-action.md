---
type: Reference
title: "Tutorial: Automated QA with Claude Code + Playwright CLI in GitHub Actions"
description: Archived — the @playwright/cli workflow this describes (claude-qa-cli.yml) no longer exists; superseded by agent-browser.
resource: brain/_archive/tutorial-claude-qa-github-action.md
tags: [reference, archive]
timestamp: 2026-07-06T00:00:00Z
---

> **Archived (2026-07-06):** this tutorial builds a `claude-qa-cli.yml` workflow
> around `@playwright/cli`. That workflow and approach no longer exist in this
> repo — QA automation was fully migrated to `agent-browser` (see
> `.github/workflows/claude-qa-browser.yml` and
> `brain/reference/tutorial-claude-qa-agent-browser-github-action.md` for the
> current approach). Kept for historical reference only.

## Tutorial: Automated QA with Claude Code + Playwright CLI in GitHub Actions

## The Problem

I'm building a workout tracking PWA — a Vue 3 app with exercises, workout flows, templates, timers, and a bunch of interactive forms. It's the kind of app where you can easily break something on one page while fixing something on another. I already had unit tests and integration tests with Vitest, but I was missing something: **does the actual app work when a real user clicks through it?**

Manual QA is tedious. I'd deploy a change, open the app, click around for a few minutes, and call it done. Half the time I'd skip pages I didn't think were affected. Meanwhile, bugs would sneak into production — a form that silently fails, a navigation link that goes nowhere, a JS error on a page I forgot to check.

I wanted an automated system that could open the app in a real browser, click around like a user, and tell me if anything is broken. Not scripted Playwright tests with hardcoded selectors — those are brittle and need constant maintenance. I wanted something that could **explore** the app and **adapt** to what it finds.

That's where Claude Code + Playwright CLI comes in.

## What We Built

A GitHub Actions workflow that:

1. Starts the dev server in CI
2. Gives Claude a browser (via `@playwright/cli`)
3. Claude explores the app like a real user — clicking navigation, filling forms, checking for JS errors
4. Returns a structured JSON report with any bugs found
5. Posts results as a PR comment and sets a commit status (green/red/yellow)

The whole thing runs in about 4 minutes and costs a few cents per run.

## The Approach: Start Small, Iterate Fast

This is the most important lesson from this project. Here's what actually happened:

**Attempt 1** — I wrote a comprehensive 100-line QA prompt: "Test the exercise library, workout flow, settings, templates, edge cases, mobile viewport..." Claude hit the 30-turn limit and never produced a report. The workflow failed.

**Attempt 2** — I trimmed the prompt to a "quick smoke test" with 15 turns. Same problem — still too much for Claude to do in 15 tool calls.

**Attempt 3** — I created a minimal `test` prompt: "Open the app. Take a snapshot. Click one nav link. Take another snapshot. Report." This worked in about 8 tool calls. The pipeline was proven.

**Lesson**: Get the pipeline green first with the simplest possible test. Then expand the prompts.

## Prerequisites

- A web app with a dev server (we use Vite, but anything serving on `localhost` works)
- A GitHub repository
- A Claude Code OAuth token

## Step 1: Get Your Claude Code Token

1. Go to your repo's **Settings > Secrets and variables > Actions**
2. Add a new secret: `CLAUDE_CODE_OAUTH_TOKEN`
3. Paste your Claude Code OAuth token

Verify it's set:

```bash
gh secret list
```

## Step 2: Understand Playwright CLI

`@playwright/cli` is a lightweight CLI for controlling a browser from the command line. Unlike the full Playwright test runner, it's designed for interactive exploration — you don't write test scripts, you issue commands one at a time. This makes it perfect for AI agents.

The key concept is **element refs**. When you run `snapshot`, you get a text representation of the page where every interactive element has a ref like `e15`, `e21`. Claude reads this snapshot, decides what to click, and uses the ref.

```bash
playwright-cli open http://localhost:5173   # Open a URL
playwright-cli snapshot                      # Get page structure with element refs
playwright-cli click e15                     # Click element by ref
playwright-cli fill e5 "value"               # Fill an input
playwright-cli console                       # Check for JS errors
playwright-cli screenshot                    # Take a screenshot
playwright-cli close                         # Close browser
```

A typical Claude interaction looks like:

1. Claude runs `snapshot` and sees: `nav[e10] > a[e11] "Home" | a[e12] "Workouts" | a[e13] "Settings"`
2. Claude decides to test navigation and runs `click e12`
3. Claude runs `snapshot` again and sees the Workouts page loaded
4. Claude concludes navigation works

## Step 2b: Try It Yourself (Locally, Before Any CI Setup)

Before writing a single line of YAML, get comfortable with the tools locally. You don't even need your own app — you can use any public website. Let's use `otto.de` (a German streaming service) as an example.

### Part 1: Playwright CLI by Hand

Install it and open a site:

```bash
npm install -g @playwright/cli@latest
playwright-cli install-browser chromium
playwright-cli open https://www.otto.de
```

A Chromium browser window opens. Now take a snapshot:

```bash
playwright-cli snapshot
```

You'll see something like:

```
- document [ref=e1]
  - banner:
    - navigation [ref=e2]:
      - link "Home" [ref=e3]
      - link "Filme" [ref=e4]
      - link "Serien" [ref=e5]
  - main:
    - heading "Willkommen" [ref=e10]
    - search [ref=e15]: textbox "Suche" [ref=e16]
    ...
```

Each `[ref=eXX]` is a handle you can interact with. Try clicking a nav link:

```bash
playwright-cli click e4
```

The browser navigates. Take another snapshot to see the new page:

```bash
playwright-cli snapshot
```

Try filling a search box:

```bash
playwright-cli fill e16 "Action"
playwright-cli press Enter
```

Check for JavaScript errors:

```bash
playwright-cli console
```

When you're done:

```bash
playwright-cli close
```

That's it. This is exactly what Claude does — the same commands, in the same order. The difference is Claude reads the snapshot output, reasons about what to click next, and does it in a loop.

### Part 2: Let Claude Drive (with `claude -p`)

Now let Claude do the clicking. The `claude -p` flag runs Claude Code with a one-shot prompt from the terminal — no interactive session, just execute and return.

```bash
claude -p "Open https://www.otto.de using playwright-cli. \
Take a snapshot. Click one navigation link. \
Take another snapshot. \
Tell me what you found." \
--allowedTools "Bash(playwright-cli*)"
```

Claude will:

1. Run `playwright-cli open https://www.otto.de`
2. Run `playwright-cli snapshot` and read the page structure
3. Pick a link and run `playwright-cli click eXX`
4. Run `playwright-cli snapshot` again
5. Tell you what it saw

Watch it work. You'll see each tool call in real time. This is the exact same loop that runs in GitHub Actions — just local.

### Part 3: Make It a QA Test

Now give Claude a more structured prompt:

```bash
claude -p "You are a QA tester. Open https://www.otto.de using playwright-cli.

Test the following:
1. Does the homepage load? (take a snapshot)
2. Does navigation work? (click 2 links, snapshot each)
3. Are there any JS errors? (check console)

Report your findings as:
- PASS or FAIL for each test
- Any bugs found" \
--allowedTools "Bash(playwright-cli*)"
```

This is essentially what our GitHub Action does, just without the CI wrapper. If this works locally, it will work in CI.

### Part 4: Try It on Your Own App

Start your dev server and point Claude at it:

```bash
# Terminal 1: start your app
npm run dev

# Terminal 2: let Claude test it
claude -p "Open http://localhost:5173 using playwright-cli. \
Take a snapshot. Navigate to 3 different pages. \
Check console for JS errors on each page. \
Report what you found." \
--allowedTools "Bash(playwright-cli*)"
```

Once you're happy with how this works locally, you're ready to put it in a GitHub Action.

## Step 3: Create the Workflow File

Create `.github/workflows/claude-qa-cli.yml`. Here's a simplified version to start with:

```yaml
name: Claude QA (CLI)

on:
  workflow_dispatch:
    inputs:
      focus:
        description: 'Test focus area'
        type: choice
        options:
          - general # Full QA exploration
          - test # Minimal smoke test (pipeline validation)
        default: 'general'
  pull_request:
    types: [labeled] # Trigger by adding a 'qa-cli' label

jobs:
  qa-cli:
    if: |
      github.event_name == 'workflow_dispatch' ||
      (github.event_name == 'pull_request' &&
       github.event.label.name == 'qa-cli')

    runs-on: ubuntu-latest
    timeout-minutes: 15

    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write
      statuses: write

    steps:
      - uses: actions/checkout@v6

      # Your own setup — install dependencies
      - name: Setup
        run: npm install

      # Install playwright-cli GLOBALLY (not as a project dep)
      - name: Install playwright-cli
        run: |
          npm install -g @playwright/cli@latest
          playwright-cli install-browser chromium

      # Start dev server in background and wait for it
      - name: Start dev server
        run: |
          npm run dev &
          DEV_PID=$!
          echo "DEV_PID=$DEV_PID" >> $GITHUB_ENV

          for i in {1..60}; do
            curl -sf http://localhost:5173 && break
            sleep 1
          done

      # Run Claude QA
      - name: Run Claude QA
        id: claude-qa
        continue-on-error: true
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          show_full_output: true
          prompt: |
            Open http://localhost:5173 using playwright-cli.
            Take a snapshot to see the page structure.
            Click through the main navigation links.
            Check the console for JS errors.
            Report any bugs you find.
          claude_args: |
            --max-turns 15
            --model claude-opus-4-20250514
            --allowedTools "Bash(playwright-cli*),Write(qa-report.md)"

      # Clean up
      - name: Cleanup
        if: always()
        run: |
          kill $DEV_PID 2>/dev/null || true
          playwright-cli close-all 2>/dev/null || true
```

### Why These Specific Options?

**`continue-on-error: true`** — This was a hard-won lesson. Without it, when Claude hits the max-turns limit (and it will while you're tuning prompts), the entire job fails immediately. None of the reporting or cleanup steps run. With `continue-on-error`, Claude's step can "fail" but the rest of the job continues.

**`show_full_output: true`** — Without this, the "Run Claude QA" step is a complete black box. You see a green or red checkmark but zero insight into what happened. With it, you see every tool call, every snapshot Claude took, every decision it made. This is essential while iterating on prompts. Don't use it on public repos though — it may expose page content in the logs.

**`--allowedTools "Bash(playwright-cli*),Write(qa-report.md)"`** — This was another lesson. Our first version used `--allowedTools "Bash,Write"` which means Claude can run _any_ bash command. It would sometimes `cat` source files, run `ls`, or do other things that waste turns. Restricting to `Bash(playwright-cli*)` means it can _only_ run playwright-cli commands. For the `general` focus where Claude might want to check network responses, we also allow `Bash(curl*)`.

**`--model claude-opus-4-20250514`** — Opus is the most capable model. For a simple pipeline test you could use Sonnet (`claude-sonnet-4-20250514`) which is faster and cheaper.

**`--max-turns 15`** — Each "turn" is one tool call (one playwright-cli command). 15 turns means Claude can run about 15 commands before it must return a result. Match this to your prompt complexity.

## Step 4: Write QA Prompts

### Start Here: The Pipeline Test

This is the prompt that finally got our pipeline working. One assertion: does navigation work?

```markdown
# Pipeline Test

Open http://localhost:5173 using playwright-cli.
Take a snapshot. Verify the page rendered.
Click one navigation link.
Take another snapshot to confirm the page loaded.
Report: HEALTHY if both pages loaded, CRITICAL_BUGS if not.
```

In our workout tracker, Claude opened the app, saw an onboarding screen, figured out it needed to click "Skip to App", navigated to the Workouts page, and reported HEALTHY. All in about 8 tool calls.

### Next: The Smoke Test

Once the pipeline is green, expand to cover more ground:

```markdown
# Smoke Test

Open http://localhost:5173 using playwright-cli.

## Steps (15 turns max)

1. Open app, take snapshot, check console for JS errors
2. Navigate to 3-4 main pages (Home, Workouts, Exercises, Settings)
3. Take a snapshot on each page to verify content loads
4. Test one form submission
5. Write qa-report.md with findings

## FAIL if

- JS errors in console
- Blank page (empty snapshot)
- Navigation doesn't work
```

### Eventually: Full QA Exploration

For thorough testing before releases, use a larger turn budget and more detailed instructions:

```markdown
# Full QA Session

## Test Plan (30 turns)

### Navigation (turns 1-5)

Click through all nav items. Verify each page loads.

### Core Features (turns 6-20)

- Exercise library: search, filter, view details
- Workout flow: start workout, add exercises, log sets, complete
- Settings: toggle options, verify they persist after reload

### Edge Cases (turns 21-26)

- Empty form submissions
- Very long text input
- Special characters in inputs

### Mobile (turns 27-28)

- Resize to 375x667
- Verify navigation is accessible

### Report (turns 29-30)

Write qa-report.md with all findings.
```

### Tips for Writing Prompts

- **Be explicit about turn budget** — Claude doesn't know how many turns it has. Say "you have 15 turns" and break the budget into phases
- **List concrete steps** — "click through navigation" is vague; "click Home, Workouts, Exercises, Settings" is actionable
- **Define done** — tell Claude when to stop exploring and start reporting
- **Keep it short** — every token in the prompt costs money and the prompt is sent on every turn. A 20-line prompt works better than a 100-line one
- **Tell Claude about your app** — "this is a workout tracker with exercises, workouts, and templates" helps Claude understand what it's looking at

## Step 5: Add Structured Output (Optional but Recommended)

Without structured output, Claude returns free-text. With a JSON schema, you get machine-readable results that your workflow can act on — like failing the build on critical bugs or posting formatted PR comments.

1. Create `.github/schemas/qa-report-schema.json`:

```json
{
  "type": "object",
  "properties": {
    "verdict": {
      "type": "string",
      "enum": ["HEALTHY", "MINOR_ISSUES", "CRITICAL_BUGS"]
    },
    "summary": { "type": "string" },
    "bugs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "type": "string", "enum": ["critical", "major", "minor"] },
          "title": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["severity", "title", "description"]
      }
    }
  },
  "required": ["verdict", "summary", "bugs"]
}
```

2. Pass it via `--json-schema` in `claude_args`

3. Access in later steps via `${{ steps.claude-qa.outputs.structured_output }}`

This lets you do things like:

```yaml
- name: Fail on critical bugs
  if: fromJSON(steps.claude-qa.outputs.structured_output).verdict == 'CRITICAL_BUGS'
  run: exit 1
```

## Step 6: Post Results to PRs

Add a step that posts Claude's findings as a PR comment:

```yaml
- name: Post results to PR
  if: github.event.pull_request.number
  uses: actions/github-script@v7
  env:
    STRUCTURED_OUTPUT: ${{ steps.claude-qa.outputs.structured_output }}
  with:
    script: |
      const data = JSON.parse(process.env.STRUCTURED_OUTPUT);
      const emoji = data.verdict === 'HEALTHY' ? '✅' : '❌';

      let body = `## ${emoji} QA Report\n\n`;
      body += `**Verdict**: ${data.verdict}\n`;
      body += `**Summary**: ${data.summary}\n\n`;

      if (data.bugs.length > 0) {
        body += `### Bugs Found\n`;
        data.bugs.forEach(b => {
          body += `- **${b.severity}**: ${b.title} — ${b.description}\n`;
        });
      }

      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
        body
      });
```

## Step 7: Trigger and Iterate

### Manual trigger (best while developing)

```bash
# Minimal test — verify the pipeline works
gh workflow run "Claude QA (CLI)" --field focus=test

# Full exploration
gh workflow run "Claude QA (CLI)" --field focus=general
```

### Via PR label

Add the `qa-cli` label to any open PR. The workflow runs and auto-removes the label when done.

### Watch the run

```bash
gh run watch <RUN_ID>           # Stream step progress
gh run view <RUN_ID> --web      # Open in browser
gh run view <RUN_ID> --log      # Full logs after completion
```

## What Claude Actually Does

Here's a real example from our workout tracker. Claude received the minimal test prompt and:

1. Ran `playwright-cli open http://localhost:5173` — app opened
2. Ran `playwright-cli snapshot` — saw an onboarding screen with a "Skip to App" button and bottom nav (Home, Workouts, Exercises, Weight, Settings)
3. Noticed the onboarding overlay was blocking navigation — clicked "Skip to App"
4. Ran `playwright-cli snapshot` — confirmed it reached the main app with a calendar view
5. Clicked "Workouts" in the bottom nav
6. Ran `playwright-cli snapshot` — confirmed the Workouts page loaded with tabs and templates
7. Returned: `{"verdict": "HEALTHY", "summary": "Navigation works correctly..."}`

The interesting part: Claude **figured out the onboarding flow on its own**. A traditional scripted test would need explicit handling for onboarding. Claude just adapted.

## Lessons Learned (The Hard Way)

### 1. Get the pipeline green before writing real tests

We wasted two runs (and tokens) on ambitious QA prompts before the pipeline itself was proven. Create a `test` focus that does the bare minimum — one page load, one click, one assertion. Once that's green, expand.

### 2. `--max-turns` is your budget, not a safety net

Each turn is one tool call. If your prompt asks Claude to test 4 pages with form submissions and mobile viewport, that's at least 20 turns. Set `--max-turns` to match your prompt, not the other way around.

| Prompt type                 | Realistic turns |
| --------------------------- | --------------- |
| Pipeline test (1 assertion) | 5-8             |
| Smoke test (navigate pages) | 10-15           |
| Full QA exploration         | 20-30           |
| Multi-flow deep dive        | 30-50           |

### 3. Restrict tools or Claude will wander

With unrestricted `Bash`, Claude sometimes reads source code, checks git history, or runs `ls`. These waste turns and don't test the UI. Lock it down to `Bash(playwright-cli*)`.

### 4. Install `@playwright/cli` globally

Using `npx @playwright/cli` works but prints a noisy warning about missing project dependencies on every invocation. `npm install -g @playwright/cli@latest` gives you a clean `playwright-cli` command.

### 5. `show_full_output` is essential for debugging (but not for production)

While iterating on prompts, you need to see what Claude is doing. Once the workflow is stable, consider turning it off — especially on public repos where the logs are visible.

### 6. `continue-on-error` prevents cascade failures

Without it, a max-turns error kills the entire job. No report gets posted, no artifacts get uploaded, no cleanup runs. Always set it on the Claude step.

## Cost and Performance

- **Pipeline test** (`focus=test`): ~4 minutes, ~8 tool calls, minimal token usage
- **Full QA** (`focus=general`): ~8-12 minutes, ~15-25 tool calls, moderate token usage
- **Model choice**: Opus is smarter but slower/pricier. Sonnet works fine for smoke tests

To keep costs down:

- Don't trigger on every push — use `workflow_dispatch` or PR labels
- Use `test` focus for CI, `general` for pre-release
- Keep prompts short — they're sent on every turn

## File Structure

Here's how we organized everything in our repo:

```
.github/
  workflows/
    claude-qa-cli.yml          # The workflow
  schemas/
    qa-report-schema.json      # Structured output schema
.claude/
  prompts/
    qa-system-prompt.md        # QA persona (shared across all focuses)
    qa-cli-test.md             # Minimal pipeline test prompt
    qa-cli-explore.md          # Full exploration prompt
```

The workflow dynamically selects the prompt file based on the `focus` input, so adding a new focus area is just adding a new prompt file and an `elif` branch.
