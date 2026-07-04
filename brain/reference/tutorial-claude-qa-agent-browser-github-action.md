---
type: Reference
title: "AI-Powered QA in GitHub Actions with Claude Code Action and Agent Browser"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/tutorial-claude-qa-agent-browser-github-action.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## AI-Powered QA in GitHub Actions with Claude Code Action and Agent Browser

## Quick Summary

- Build a GitHub Actions workflow that runs Claude Code as a QA agent using [Claude Code Action](https://github.com/anthropics/claude-code-action) and [Agent Browser](https://github.com/vercel-labs/agent-browser)
- Claude opens your app, clicks through pages, checks for JS errors, and reports bugs — all automatically on every PR
- Structured JSON output powers PR comments with coverage tables and bug lists
- Runs in about 2 minutes and costs ~$0.15 per run

## Overview

By the end of this tutorial, you'll have a GitHub Actions workflow that:

1. Starts your dev server in CI
2. Gives Claude a browser via `agent-browser` (a Rust-based CLI from Vercel)
3. Claude explores the app like a real user — clicking navigation, filling forms, checking for JS errors
4. Returns a structured JSON report with a verdict, coverage metrics, and any bugs found
5. Posts results as a PR comment and sets a commit status (green/yellow/red)

The workflow uses [Claude Code Action](https://github.com/anthropics/claude-code-action) (`anthropics/claude-code-action@v1`), a GitHub Action that runs Claude Code on your own runner. You provide a prompt and configuration — it handles authentication, tool access, and structured output.

## Before you start

You'll need:

- A GitHub repository with a web app that runs a dev server
- A Claude Code OAuth token (or API key for Bedrock/Vertex AI/Foundry)
- Familiarity with GitHub Actions basics

## Step 1: Set up your Claude Code token

The easiest method: open Claude Code in your terminal and run `/install-github-app`. This guides you through setting up the GitHub app and required secrets automatically.

> **Note:** `/install-github-app` requires repository admin access and is only available for direct Anthropic API users. For AWS Bedrock, Google Vertex AI, or Microsoft Foundry, see the [cloud providers docs](https://github.com/anthropics/claude-code-action/blob/main/docs/cloud-providers.md).

Manual setup:

1. Go to your repo's **Settings > Secrets and variables > Actions**
2. Add a new secret: `CLAUDE_CODE_OAUTH_TOKEN`
3. Paste your token

Verify:

```bash
gh secret list
```

## Step 2: Create the QA prompts

The workflow loads prompts from files, which makes them easy to iterate on without touching the YAML.

### QA persona (shared across all prompts)

Create `.claude/prompts/qa-system-prompt.md`:

```markdown
# QA Engineer Identity

You are **Quinn**, a veteran QA engineer. You test through the browser
like a real user. You cannot read source code.

## Rules

1. **UI ONLY.** Interact through the browser. No reading files.
2. **OBSERVE, DON'T ASSUME.** Report what actually happened.
3. **SCREENSHOT BUGS.** Every bug gets a screenshot.
4. **CONTINUE AFTER BUGS.** Document it, then keep testing.

## Bug Severity

- **Critical**: Crashes, data loss, blank screens
- **Major**: Feature broken, user blocked
- **Minor**: Visual glitch, typo (workaround exists)
```

### Pipeline test (minimal — start here)

Create `.claude/prompts/qa-browser-test.md`:

```markdown
# Pipeline Test — Nav Check

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## Mission

Minimal test: open the app and verify navigation works.

## CRITICAL: How to interact with the browser

`agent-browser` is a **CLI tool** installed on this machine. Run all commands
using the **Bash tool** — do NOT search for MCP tools or use ToolSearch.
Just call Bash directly with the command.

## Steps (5 turns max)

1. Open the app — run in Bash: `agent-browser open {{APP_URL}}`
2. Take a snapshot — run in Bash: `agent-browser snapshot`
3. Verify the page rendered (snapshot is not empty)
4. Click one navigation link — run in Bash: `agent-browser click @e3` (use refs from snapshot)
5. Take another snapshot to confirm the new page loaded
6. Return your JSON result

## Structured Output

Your final response MUST be valid JSON matching the provided schema.

- `verdict`: `HEALTHY` if both pages loaded, `CRITICAL_BUGS` if not
- `summary`: One sentence
- `coverage`: Set navigation total/passed/failed. Set other areas to 0.
- `bugs`: Empty array if nav works, otherwise describe the issue
- `console_errors`: Empty array
- `metrics`: Match your coverage numbers
```

> **Why the "CRITICAL" section?** Claude Code has access to many tool types (MCP tools, ToolSearch, Bash, etc.). Without explicit instructions, it may search for `agent-browser` as an MCP tool instead of running it as a CLI command through Bash.

### Smoke test (broader coverage)

Create `.claude/prompts/qa-browser-explore.md`:

````markdown
# Quick Smoke Test

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## CRITICAL: How to interact with the browser

`agent-browser` is a **CLI tool** installed on this machine. Run all commands
using the **Bash tool** — do NOT search for MCP tools or use ToolSearch.

## agent-browser Commands Reference

```bash
agent-browser open {{APP_URL}}       # Open browser and navigate
agent-browser snapshot                # Get accessibility tree with refs (@e1, @e2)
agent-browser snapshot -i             # Interactive elements only (buttons, inputs, links)
agent-browser click @e15              # Click element by ref (note the @ prefix!)
agent-browser fill @e3 "text"         # Clear and fill input by ref
agent-browser screenshot              # Take screenshot
agent-browser console                 # Check JS console errors
agent-browser get text @e1            # Get text content of element
agent-browser get url                 # Get current URL
agent-browser close                   # Done
```
````

Element refs use the `@` prefix: `@e1`, `@e2`, etc. Get refs from `snapshot` output.

## Turn Budget: 15 turns MAX

| Phase         | Turns | Goal                               |
| ------------- | ----- | ---------------------------------- |
| Open & verify | 1-3   | Open app, snapshot, check console  |
| Navigate      | 4-8   | Click through 3-4 main pages       |
| Report        | 9-10  | Write qa-report.md and return JSON |

## Test Steps

1. Open the app and take a snapshot — verify it renders
2. Check console for JS errors
3. Navigate to 3-4 different pages via the navigation
4. Take a snapshot on each page to verify content loads
5. Write `qa-report.md` with findings

## FAIL if

- JS errors in console
- Blank page (empty snapshot)
- Navigation doesn't work

## Structured Output

Your final response MUST be valid JSON matching the provided schema.
Also write `qa-report.md` as backup.

````

## Step 3: Create the structured output schema

Create `.github/schemas/qa-report-schema.json`:

```json
{
  "type": "object",
  "properties": {
    "verdict": {
      "type": "string",
      "enum": ["HEALTHY", "MINOR_ISSUES", "CRITICAL_BUGS"]
    },
    "summary": { "type": "string" },
    "coverage": {
      "type": "object",
      "properties": {
        "navigation": {
          "type": "object",
          "properties": {
            "total": { "type": "integer" },
            "passed": { "type": "integer" },
            "failed": { "type": "integer" }
          },
          "required": ["total", "passed", "failed"]
        },
        "forms": {
          "type": "object",
          "properties": {
            "total": { "type": "integer" },
            "passed": { "type": "integer" },
            "failed": { "type": "integer" }
          },
          "required": ["total", "passed", "failed"]
        },
        "core_features": {
          "type": "object",
          "properties": {
            "total": { "type": "integer" },
            "passed": { "type": "integer" },
            "failed": { "type": "integer" }
          },
          "required": ["total", "passed", "failed"]
        },
        "mobile": {
          "type": "object",
          "properties": {
            "total": { "type": "integer" },
            "passed": { "type": "integer" },
            "failed": { "type": "integer" }
          },
          "required": ["total", "passed", "failed"]
        }
      },
      "required": ["navigation", "forms", "core_features", "mobile"]
    },
    "bugs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "severity": {
            "type": "string",
            "enum": ["critical", "major", "minor", "suggestion"]
          },
          "title": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["id", "severity", "title", "description"]
      }
    },
    "console_errors": {
      "type": "array",
      "items": { "type": "string" }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "total_tests": { "type": "integer" },
        "passed": { "type": "integer" },
        "failed": { "type": "integer" },
        "critical_bugs": { "type": "integer" },
        "major_bugs": { "type": "integer" },
        "minor_bugs": { "type": "integer" }
      },
      "required": ["total_tests", "passed", "failed", "critical_bugs", "major_bugs", "minor_bugs"]
    }
  },
  "required": ["verdict", "summary", "coverage", "bugs", "console_errors", "metrics"]
}
````

When passed via `--json-schema`, the validated JSON automatically becomes a [GitHub Action output](https://github.com/anthropics/claude-code-action#structured-outputs) at `steps.claude-qa.outputs.structured_output`.

## Step 4: Create the GitHub Actions workflow

Create `.github/workflows/claude-qa-browser.yml`:

```yaml
name: Claude QA (Browser)

on:
  workflow_dispatch:
    inputs:
      focus:
        description: 'Test focus area'
        type: choice
        options:
          - general
          - test
        default: 'general'
      pr_number:
        description: 'PR number (for posting results)'
        required: false
        type: string
  pull_request:
    types: [labeled]

jobs:
  qa-browser:
    if: |
      github.event_name == 'workflow_dispatch' ||
      (github.event_name == 'pull_request' &&
       github.event.label.name == 'qa-browser')

    runs-on: ubuntu-latest
    timeout-minutes: 15

    concurrency:
      group: claude-qa-browser-${{ github.event.pull_request.number || github.ref }}
      cancel-in-progress: true

    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write
      statuses: write

    steps:
      - uses: actions/checkout@v6

      # Replace with your own setup (npm install, pnpm install, etc.)
      - name: Setup
        run: npm install

      - name: Install agent-browser
        run: |
          npm install -g agent-browser
          agent-browser install --with-deps

      - name: Start dev server
        run: |
          npm run dev &
          DEV_PID=$!
          echo "DEV_PID=$DEV_PID" >> $GITHUB_ENV

          for i in {1..60}; do
            if curl -sf http://localhost:5173 | grep -qE '(id="app"|<title>)'; then
              echo "Dev server ready!"
              exit 0
            fi
            sleep 1
          done
          echo "Dev server failed to start"
          exit 1

      - name: Load QA prompt
        id: load-prompt
        run: |
          TODAY=$(date +%Y-%m-%d)

          # Set allowed tools BEFORE the heredoc block.
          # Writing this inside { } >> $GITHUB_OUTPUT puts it inside
          # the heredoc content instead of as a separate output variable.
          FOCUS="${{ github.event.inputs.focus || 'general' }}"
          if [ "$FOCUS" = "test" ]; then
            PROMPT_FILE=".claude/prompts/qa-browser-test.md"
            echo "allowed_tools=Bash(agent-browser*),Write(qa-report.md)" >> $GITHUB_OUTPUT
          else
            PROMPT_FILE=".claude/prompts/qa-browser-explore.md"
            echo "allowed_tools=Bash(agent-browser*),Bash(curl*),Write(qa-report.md)" >> $GITHUB_OUTPUT
          fi

          {
            echo 'prompt<<PROMPT_EOF'
            cat .claude/prompts/qa-system-prompt.md
            echo ""
            echo "---"
            echo ""
            TASK=$(cat "$PROMPT_FILE")
            TASK="${TASK//\{\{APP_URL\}\}/http://localhost:5173}"
            TASK="${TASK//\{\{DATE\}\}/$TODAY}"
            echo "$TASK"
            echo 'PROMPT_EOF'
          } >> $GITHUB_OUTPUT

      - name: Load QA schema
        id: load-schema
        run: |
          # claude_args is tokenized shell-words style: a single quote inside
          # the schema closes the --json-schema '...' arg and silently hangs
          # the CLI at startup. Escaping as \' does NOT survive the parser —
          # ban the character instead of trying to escape it.
          if grep -q "'" .github/schemas/qa-report-schema.json; then
            echo "::error::schema must not contain single quotes"
            exit 1
          fi
          SCHEMA=$(jq -c . .github/schemas/qa-report-schema.json)
          echo "schema=$SCHEMA" >> $GITHUB_OUTPUT

      - name: Run Claude QA
        id: claude-qa
        continue-on-error: true
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          show_full_output: true
          prompt: ${{ steps.load-prompt.outputs.prompt }}
          claude_args: |
            --max-turns 15
            --model claude-opus-4-20250514
            --allowedTools "${{ steps.load-prompt.outputs.allowed_tools }}"
            --json-schema '${{ steps.load-schema.outputs.schema }}'

      # ⚠️ Never interpolate file contents into claude_args (e.g.
      # --append-system-prompt "$(cat prompt.md)"): any embedded quote breaks
      # tokenization and the CLI hangs BEFORE init with zero output — the log
      # shows "SDK options: {...}" and then nothing until the timeout. Long
      # instructions belong in the file-based `prompt` input, which is never
      # shell-parsed. Post-mortem: brain/lessons/claude-args-quoting-hang.md

      - name: Set commit status
        id: qa-status
        if: always()
        uses: actions/github-script@v7
        env:
          STRUCTURED_OUTPUT: ${{ steps.claude-qa.outputs.structured_output }}
        with:
          script: |
            const fs = require('fs');
            let state = 'success';
            let description = 'QA passed';

            const structuredOutput = process.env.STRUCTURED_OUTPUT;
            if (structuredOutput && structuredOutput.trim()) {
              try {
                const data = JSON.parse(structuredOutput);

                if (data.verdict === 'CRITICAL_BUGS' || data.metrics.critical_bugs > 0) {
                  state = 'failure';
                  description = `QA found ${data.metrics.critical_bugs} critical bug(s)`;
                } else if (data.verdict === 'MINOR_ISSUES' || data.metrics.major_bugs > 0) {
                  state = 'pending';
                  const issueCount = (data.metrics.minor_bugs || 0) + (data.metrics.major_bugs || 0);
                  description = `QA found ${issueCount} issue(s) to review`;
                } else {
                  state = 'success';
                  description = `QA passed (${data.metrics.passed}/${data.metrics.total_tests} tests)`;
                }

                core.setOutput('metrics', JSON.stringify(data.metrics));
                core.setOutput('verdict', data.verdict);
              } catch (parseErr) {
                core.warning(`Failed to parse structured output: ${parseErr.message}`);
              }
            } else {
              try {
                const report = fs.readFileSync('qa-report.md', 'utf8');
                if (/CRITICAL/i.test(report)) {
                  state = 'failure';
                  description = 'QA found critical issues';
                } else if (/MINOR/i.test(report) || report.includes('WARNING')) {
                  state = 'pending';
                  description = 'QA found minor issues';
                }
              } catch (e) {
                state = 'error';
                description = 'QA report not generated';
              }
            }

            await github.rest.repos.createCommitStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: context.sha,
              state: state,
              context: 'Claude QA (Browser)',
              description: description,
              target_url: `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
            });

            core.setOutput('qa_state', state);

      - name: Post results to PR
        if: |
          always() &&
          (github.event.pull_request.number || github.event.inputs.pr_number)
        uses: actions/github-script@v7
        env:
          PR_NUMBER_INPUT: ${{ github.event.inputs.pr_number }}
          STRUCTURED_OUTPUT: ${{ steps.claude-qa.outputs.structured_output }}
        with:
          script: |
            const fs = require('fs');
            const prNumber = context.payload.pull_request?.number ||
                            process.env.PR_NUMBER_INPUT;

            if (!prNumber) return;

            const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            let qaReport = '';

            const structuredOutput = process.env.STRUCTURED_OUTPUT;
            if (structuredOutput && structuredOutput.trim()) {
              try {
                const data = JSON.parse(structuredOutput);
                const verdictEmoji = data.verdict === 'HEALTHY' ? '✅' :
                                     data.verdict === 'MINOR_ISSUES' ? '⚠️' : '❌';

                const coverageRows = ['navigation', 'forms', 'core_features', 'mobile']
                  .map(area => {
                    const c = data.coverage[area];
                    const label = area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `| ${label} | ${c.passed} | ${c.failed} | ${c.total} |`;
                  })
                  .join('\n');

                let bugsSection = '';
                if (data.bugs.length > 0) {
                  const bugRows = data.bugs.map(b => {
                    const sev = b.severity === 'critical' ? '🔴' :
                                b.severity === 'major' ? '🟠' : '🟡';
                    return `| ${b.id} | ${sev} ${b.severity} | ${b.title} |`;
                  }).join('\n');
                  bugsSection = `### Bugs Found (${data.bugs.length})\n\n| # | Severity | Description |\n|---|----------|-------------|\n${bugRows}`;
                } else {
                  bugsSection = '### Bugs Found\n\n✅ No bugs found';
                }

                qaReport = [
                  `**Verdict**: ${verdictEmoji} **${data.verdict}**`,
                  '',
                  `**Summary**: ${data.summary}`,
                  '',
                  '### Test Coverage',
                  '',
                  '| Area | Passed | Failed | Total |',
                  '|------|--------|--------|-------|',
                  coverageRows,
                  '',
                  `**Overall**: ${data.metrics.passed}/${data.metrics.total_tests} tests passed`,
                  '',
                  bugsSection
                ].join('\n');
              } catch (parseErr) {
                core.warning(`Failed to parse structured output: ${parseErr.message}`);
              }
            }

            if (!qaReport) {
              try {
                qaReport = fs.readFileSync('qa-report.md', 'utf8');
              } catch (e) {
                qaReport = `⚠️ QA report not generated. Check [workflow logs](${runUrl})`;
              }
            }

            const body = [
              '## 🔍 Claude QA Report (Browser Mode)',
              '',
              `**Method**: agent-browser`,
              `**Run**: [View Logs](${runUrl})`,
              '',
              '---',
              '',
              qaReport,
              '',
              '---',
              '_Automated QA by Claude Code + agent-browser_'
            ].join('\n');

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: parseInt(prNumber),
              body: body
            });

      - name: Upload QA artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: qa-browser-artifacts-${{ github.run_id }}
          path: qa-report.md
          if-no-files-found: ignore

      - name: Remove trigger label
        if: |
          github.event_name == 'pull_request' &&
          github.event.label.name == 'qa-browser'
        uses: actions/github-script@v7
        with:
          script: |
            try {
              await github.rest.issues.removeLabel({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                name: 'qa-browser'
              });
            } catch (e) {
              if (e.status !== 404) core.warning(`Failed to remove label: ${e.message}`);
            }

      - name: Cleanup
        if: always()
        run: |
          kill $DEV_PID 2>/dev/null || true
          agent-browser close 2>/dev/null || true

      - name: Fail job if QA found issues
        if: steps.qa-status.outputs.qa_state == 'failure'
        run: |
          echo "QA found critical issues - failing the pipeline"
          exit 1
```

### Key configuration explained

| Option                                  | Why                                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `continue-on-error: true`               | Claude may hit the turn limit while you tune prompts. Without this, reporting and cleanup steps never run. |
| `show_full_output: true`                | See every tool call Claude makes. Essential for debugging prompts. Turn off on public repos.               |
| `--allowedTools "Bash(agent-browser*)"` | Without this, Claude reads source code, runs `ls`, checks git history — wasting turns on non-UI actions.   |
| `--model claude-opus-4-20250514`        | Opus is the most capable. For pipeline tests, Sonnet is faster and cheaper.                                |
| `--max-turns 15`                        | Each turn = one tool call. Match to your prompt scope.                                                     |
| `agent-browser install --with-deps`     | On Ubuntu CI runners, Chrome needs system libraries. Without `--with-deps`, Chrome won't launch.           |

### Gotcha: heredoc output ordering

The `allowed_tools` output must be set **before** the `{ ... } >> $GITHUB_OUTPUT` heredoc block. If you put `echo "allowed_tools=..." >> $GITHUB_OUTPUT` inside the block, it gets written between the heredoc delimiters and becomes part of the prompt text instead of a separate output variable. The result is `--allowedTools ""` and Claude can't use any tools.

## Step 5: Trigger the workflow

### Manual trigger

```bash
# Minimal pipeline test
gh workflow run "Claude QA (Browser)" --field focus=test

# Full smoke test
gh workflow run "Claude QA (Browser)" --field focus=general

# Watch progress
gh run list --workflow="Claude QA (Browser)" --limit 1
gh run watch <RUN_ID>
```

### Via PR label

Add the `qa-browser` label to any open PR. The workflow runs and auto-removes the label when done.

### What a successful run looks like

```
✓ qa-browser in 2m15s
  ✓ Checkout repository
  ✓ Setup
  ✓ Install agent-browser
  ✓ Start dev server
  ✓ Load QA prompt
  ✓ Load QA schema
  ✓ Run Claude QA
  ✓ Set commit status
  ✓ Upload QA artifacts
  ✓ Cleanup
  - Fail job if QA found issues (skipped — no issues)
```

Claude's actual tool call sequence for the pipeline test:

1. `agent-browser open http://localhost:5173` — app opened
2. `agent-browser snapshot` — saw the page structure with refs (`@e1`, `@e2`, etc.)
3. `agent-browser click @e5` — clicked a navigation link
4. `agent-browser snapshot` — confirmed the new page loaded
5. Returned `{"verdict": "HEALTHY", "summary": "Navigation works correctly..."}`

Five tool calls, well under the 15-turn budget.

## Cost and performance

| Mode                         | Duration | Tool Calls | Approx. Cost |
| ---------------------------- | -------- | ---------- | ------------ |
| Pipeline test (`focus=test`) | ~2 min   | ~5 calls   | ~$0.10       |
| Smoke test (`focus=general`) | ~4 min   | ~12 calls  | ~$0.25       |
| GitHub Actions runner        | —        | —          | ~$0.05       |

To keep costs down:

- Don't trigger on every push — use `workflow_dispatch` or PR labels
- Use `test` focus for CI validation, `general` for pre-release
- Use `snapshot -i` (interactive elements only) instead of full `snapshot` to reduce tokens

## File structure

```
.github/
  workflows/
    claude-qa-browser.yml          # The workflow
  schemas/
    qa-report-schema.json          # Structured output schema
.claude/
  prompts/
    qa-system-prompt.md            # QA persona (shared)
    qa-browser-test.md             # Minimal pipeline test
    qa-browser-explore.md          # Smoke test
```

Adding a new focus area is just adding a new prompt file and an `elif` branch in the "Load QA prompt" step.

## Going further: PR-aware verification mode

The workflow above does general smoke testing — it doesn't know _what changed_ in the PR. The real power comes when you inject the PR description into the prompt so Claude knows exactly what to verify.

### The idea

A PR description says "Added rest timer between sets with configurable duration." Instead of Claude blindly clicking around, it reads that description, extracts testable requirements ("rest timer exists", "duration is configurable", "timer counts down between sets"), and systematically verifies each one. It can also follow linked issues for additional context.

### How it works

1. A workflow step fetches the PR title, body, and any linked issues via the GitHub API
2. Those get injected into the prompt as `{{PR_TITLE}}`, `{{PR_BODY}}`, `{{LINKED_ISSUES}}` placeholders
3. The prompt instructs Claude to parse requirements from the description, then test each one

### Step 1: Add a "Get PR context" step

Add this before the "Load QA prompt" step:

```yaml
- name: Get PR context
  if: github.event.inputs.focus == 'verify'
  id: pr-context
  uses: actions/github-script@v7
  env:
    PR_NUMBER_INPUT: ${{ github.event.inputs.pr_number }}
  with:
    script: |
      let prNumber, prBody, prTitle;

      if (context.eventName === 'pull_request') {
        prNumber = context.payload.pull_request.number;
        prBody = context.payload.pull_request.body || '';
        prTitle = context.payload.pull_request.title;
      } else if (process.env.PR_NUMBER_INPUT) {
        prNumber = parseInt(process.env.PR_NUMBER_INPUT, 10);
        const { data: pr } = await github.rest.pulls.get({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: prNumber
        });
        prBody = pr.body || '';
        prTitle = pr.title;
      }

      // Fetch linked issues (closes #123, fixes #456)
      let linkedIssues = '';
      if (prBody) {
        const matches = prBody.match(/(?:closes|fixes|resolves)\s+#(\d+)/gi) || [];
        for (const match of matches) {
          const issueNum = match.match(/\d+/)[0];
          try {
            const { data: issue } = await github.rest.issues.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: parseInt(issueNum)
            });
            linkedIssues += `\n### Issue #${issueNum}: ${issue.title}\n${issue.body || ''}\n`;
          } catch (e) {}
        }
      }

      core.setOutput('pr_number', prNumber || '');
      core.setOutput('pr_title', prTitle || '');
      core.setOutput('pr_body', prBody || '');
      core.setOutput('linked_issues', linkedIssues);
```

### Step 2: Create the verify prompt

Create `.claude/prompts/qa-browser-verify.md`:

```markdown
# PR Verification Testing

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## PR Under Test

**PR #{{PR_NUMBER}}**: {{PR_TITLE}}

### Description

{{PR_BODY}}

### Linked Issues

{{LINKED_ISSUES}}

---

## CRITICAL: How to interact with the browser

`agent-browser` is a **CLI tool** installed on this machine. Run all commands
using the **Bash tool** — do NOT search for MCP tools or use ToolSearch.

## Your Mission

This PR claims to implement or fix something. Your job is to:

1. **Parse** the PR description and extract testable requirements
2. **Verify** each requirement actually works through the UI
3. **Break** them with edge cases and invalid inputs
4. **Check** for regressions in related features

## Turn Budget: 30 turns

| Phase              | Turns | Goal                                        |
| ------------------ | ----- | ------------------------------------------- |
| Parse Requirements | 1-2   | Extract testable items from PR description  |
| Happy Path         | 3-15  | Verify each requirement works as described  |
| Break It           | 16-24 | Edge cases, invalid inputs, boundary values |
| Report             | 25-30 | Write qa-report.md and return JSON          |

## Step 1: Parse Requirements

Read the PR description and linked issues above. Extract specific, testable requirements:

- "User can X" -> Test that user can X
- "Fixes Y bug" -> Verify Y bug no longer occurs
- "Adds Z feature" -> Test all aspects of Z

## Step 2: Happy Path

For EACH requirement:

1. Navigate to the relevant page
2. Test the exact scenario described
3. Verify expected behavior occurs

## Step 3: Break It

For every input or interactive element the PR touches:

| Attack        | How                              |
| ------------- | -------------------------------- |
| Empty         | Submit with nothing filled in    |
| Boundaries    | Try 0, -1, 999999                |
| Long strings  | 100+ characters                  |
| Special chars | Quotes, emoji, angle brackets    |
| Rapid actions | Click submit multiple times fast |

## Structured Output

Your final response MUST be valid JSON matching the provided schema.
Also write `qa-report.md` as backup.
```

### Step 3: Update the workflow to support verify mode

Add `verify` to the focus choices and update the prompt loading:

```yaml
# In workflow_dispatch inputs:
focus:
  type: choice
  options:
    - general
    - test
    - verify    # NEW

# In the "Load QA prompt" step, update the if/else:
FOCUS="${{ github.event.inputs.focus || 'general' }}"
if [ "$FOCUS" = "test" ]; then
  PROMPT_FILE=".claude/prompts/qa-browser-test.md"
  echo "allowed_tools=Bash(agent-browser*),Write(qa-report.md)" >> $GITHUB_OUTPUT
elif [ "$FOCUS" = "verify" ]; then
  PROMPT_FILE=".claude/prompts/qa-browser-verify.md"
  echo "allowed_tools=Bash(agent-browser*),Bash(curl*),Write(qa-report.md)" >> $GITHUB_OUTPUT
else
  PROMPT_FILE=".claude/prompts/qa-browser-explore.md"
  echo "allowed_tools=Bash(agent-browser*),Bash(curl*),Write(qa-report.md)" >> $GITHUB_OUTPUT
fi

# In the heredoc block, add placeholder replacement for verify mode:
if [ "$FOCUS" = "verify" ]; then
  TASK="${TASK//\{\{PR_NUMBER\}\}/${{ steps.pr-context.outputs.pr_number }}}"
  TASK="${TASK//\{\{PR_TITLE\}\}/${{ steps.pr-context.outputs.pr_title }}}"
fi
```

For the multi-line PR body and linked issues, pass them via environment variables since bash substitution breaks on newlines:

```yaml
env:
  PR_BODY_RAW: ${{ steps.pr-context.outputs.pr_body }}
  LINKED_ISSUES_RAW: ${{ steps.pr-context.outputs.linked_issues }}
run: |
  # ... inside the heredoc block:
  if [ "$FOCUS" = "verify" ]; then
    TASK="${TASK//\{\{PR_BODY\}\}/$PR_BODY_RAW}"
    TASK="${TASK//\{\{LINKED_ISSUES\}\}/$LINKED_ISSUES_RAW}"
  fi
```

### Step 4: Trigger it

```bash
# Verify a specific PR
gh workflow run "Claude QA (Browser)" --field focus=verify --field pr_number=42

# Or add a label to the PR (update the workflow if condition)
```

Now Claude reads "Added rest timer with configurable duration, closes #87", fetches issue #87 for the original requirements, opens the app, navigates to the workout flow, starts a workout, completes a set, verifies a timer appears, tries changing the duration, tests with 0 and negative values, and reports back what passed and what broke.

The difference between blind exploration and PR-aware verification is like the difference between a QA tester who just got hired versus one who read the ticket before testing.

## Tips

1. **Start with the pipeline test.** Get `focus=test` green before expanding to `general`. A minimal "open, click, snapshot" prompt proves the entire infrastructure works.

2. **Tell Claude _how_ to use the tool.** Claude Code has many tool types (MCP, ToolSearch, Bash). If your tool is a CLI command run through Bash, say so explicitly in the prompt. We use a bold "CRITICAL" section for this.

3. **`snapshot -i` over `snapshot`.** The full accessibility tree can be large. `snapshot -i` returns only interactive elements (buttons, links, inputs), which is what Claude needs to decide what to click.

4. **Always have a fallback report.** Include `Write(qa-report.md)` in `allowedTools` so Claude writes a markdown report as backup. The commit status step parses it if structured output fails.

5. **`--max-turns` is your budget.** Each turn is one tool call. If your prompt asks Claude to test 4 pages with form submissions, that's at least 15 turns. Match the limit to your prompt scope.

## Cloud provider options

This tutorial uses a direct Anthropic API token, but Claude Code Action also supports [Amazon Bedrock, Google Vertex AI, and Microsoft Foundry](https://github.com/anthropics/claude-code-action/blob/main/docs/cloud-providers.md). The action runs entirely on your own GitHub runner — API calls go to your chosen provider, so your app's source code and test data never leave your infrastructure.

## Next steps

- [Agent Browser documentation](https://github.com/vercel-labs/agent-browser) — full command reference
- [Claude Code Action on GitHub](https://github.com/anthropics/claude-code-action) — the GitHub Action used in this tutorial
- [Claude Code Action Solutions Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/solutions.md) — ready-to-use automation patterns
- [Claude Code Action Custom Automations](https://github.com/anthropics/claude-code-action/blob/main/docs/custom-automations.md) — examples of automated workflows
