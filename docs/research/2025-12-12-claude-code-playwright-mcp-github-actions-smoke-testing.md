# Research: Claude Code with Playwright MCP for Automated Smoke Testing in GitHub Actions

**Date:** 2025-12-12
**Status:** Complete

## Problem Statement

Integrate Claude Code AI into GitHub Actions to perform automated smoke tests using Playwright MCP, with the development server running. This would enable AI-assisted UI testing that can navigate the application, verify user flows, and detect issues beyond what traditional automated tests catch.

The goal is to extend the existing Claude Code review setup (already configured in `.github/workflows/claude.yml` and `.github/workflows/claude-code-review.yml`) to include AI-driven smoke testing on PRs.

## Key Findings

### 1. Current Infrastructure (Already Configured)

The project already has Claude Code GitHub Actions integration:

| File | Purpose |
|------|---------|
| `.github/workflows/claude.yml` | On-demand Claude via `@claude` mentions |
| `.github/workflows/claude-code-review.yml` | Automatic PR code reviews |
| `.github/workflows/ci.yml` | Full CI pipeline with Playwright tests |

**Authentication:** Uses `CLAUDE_CODE_OAUTH_TOKEN` secret (OAuth method).

### 2. Playwright MCP Server

Microsoft's official Playwright MCP server enables browser automation controlled by Claude:

```bash
# Installation
npx @playwright/mcp@latest

# Key options for CI
--headless          # Run without visible browser
--isolated          # Clean browser profile (no state persistence)
```

**MCP Configuration (local `~/.claude.json`):**
```json
{
  "projects": {
    "/path/to/project": {
      "mcpServers": {
        "playwright": {
          "command": "npx",
          "args": ["@playwright/mcp@latest", "--headless", "--isolated"]
        }
      }
    }
  }
}
```

### 3. Headless Mode for CI

Claude Code supports non-interactive execution:

```bash
# Basic headless execution
claude -p "Your prompt here" \
    --output-format stream-json \
    --allowedTools "Bash,Read,mcp__playwright"
```

**Environment variable for CI authentication:**
```yaml
env:
  CLAUDE_CODE_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 4. Key Limitations

| Challenge | Impact | Mitigation |
|-----------|--------|------------|
| MCP servers designed for desktop | May require workarounds in CI | Use `--headless` and `--isolated` flags |
| Non-deterministic AI outputs | Tests may vary between runs | Focus on smoke tests, not assertions |
| Rate limits | Large prompts hit limits quickly | Set `--max-turns`, use timeouts |
| Cost | Each run consumes API tokens | Limit to critical paths only |
| Reliability | AI automation ~15% vs traditional 96% | Use as supplement, not replacement |

## Codebase Patterns

### Existing Test Infrastructure

The project uses **Vitest with Playwright browser provider** (not standalone Playwright):

```typescript
// vitest.config.ts
browser: {
  provider: 'playwright',
  name: 'chromium',
  headless: true,
}
```

**Test projects:**
- `default` - Integration tests
- `a11y` - Accessibility tests
- `visual` - Visual regression tests

### Existing CI Jobs

```yaml
# Current smoke test equivalent
jobs:
  type-check: pnpm type-check
  lint: pnpm lint
  test: pnpm test:coverage
  test-a11y: pnpm test:a11y
  test-visual: pnpm test:visual (macOS)
  performance-budget: lhci autorun
```

### Claude Code Skills & Agents

Existing assets in `.claude/`:
- 9 reviewer agents (accessibility, security, performance, etc.)
- 17 commands including `/check` for parallel reviews
- Skills for testing patterns

## Recommended Approach

### Option A: Direct Playwright MCP Integration (Complex)

Add a new job that runs Claude Code with Playwright MCP to perform AI-driven smoke tests.

**Workflow: `.github/workflows/claude-smoke-test.yml`**

```yaml
name: Claude Smoke Tests

on:
  pull_request:
    branches: [main]

concurrency:
  group: smoke-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: 22
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Build application
        run: pnpm build-only

      - name: Start preview server
        run: |
          pnpm preview --port 4173 &
          sleep 5  # Wait for server to start

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run Claude Smoke Tests
        env:
          CLAUDE_CODE_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "$(cat <<'EOF'
          You have access to the Playwright MCP server. Perform smoke tests on http://localhost:4173:

          1. Navigate to the home page and verify it loads without errors
          2. Check that the main navigation works (exercises, workouts, settings)
          3. Test creating a new exercise
          4. Test starting a workout from a template
          5. Verify the settings page loads correctly

          Report any issues found. Focus on:
          - Page load errors
          - Console errors
          - Broken navigation
          - Missing UI elements
          - Accessibility issues visible in the DOM

          Be concise. List only actual issues found.
          EOF
          )" \
            --output-format stream-json \
            --max-turns 20 \
            --mcp-config '{"playwright":{"command":"npx","args":["@playwright/mcp@latest","--headless","--isolated"]}}' \
            > smoke-test-results.json

      - name: Post results to PR
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = fs.readFileSync('smoke-test-results.json', 'utf8');

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## Claude Smoke Test Results\n\n\`\`\`\n${results.slice(0, 60000)}\n\`\`\``
            });
```

### Option B: Use Claude Code Action with Custom Prompt (Simpler)

Extend the existing Claude Code Action setup:

```yaml
name: Claude Smoke Tests (Action)

on:
  pull_request:
    branches: [main]

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      pull-requests: write
      actions: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup and Build
        run: |
          corepack enable
          pnpm install
          pnpm build-only

      - name: Start preview server
        run: pnpm preview --port 4173 &

      - name: Claude Smoke Tests
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            The app is running at http://localhost:4173.

            Use the Bash tool with curl to verify these endpoints:
            1. curl -s http://localhost:4173/ - Home page loads
            2. curl -s http://localhost:4173/exercises - Exercises page
            3. curl -s http://localhost:4173/settings - Settings page

            For each endpoint, check:
            - HTTP 200 response
            - HTML contains expected content
            - No error indicators in response

            Report any failures found.
          claude_args: |
            --max-turns 10
            --allowedTools "Bash(curl:*)"
```

### Option C: Hybrid Approach (Recommended)

1. **Use existing Vitest/Playwright tests** for deterministic smoke tests
2. **Add Claude Code review** that analyzes test results and PR changes together
3. **Use Claude for exploratory testing** only on critical PRs (manual trigger)

**Add to existing `claude-code-review.yml`:**

```yaml
- name: Run smoke tests
  run: pnpm test:coverage
  continue-on-error: true

- name: Claude analyzes test results
  uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    prompt: |
      Review the PR changes and test results.

      1. Check if the changes have adequate test coverage
      2. Identify any user flows that might be affected but not tested
      3. Suggest additional smoke tests if needed

      Be specific about which files/functions need more testing.
```

## Implementation Steps

### Phase 1: Local Validation

```bash
# 1. Add Playwright MCP locally
claude mcp add playwright npx @playwright/mcp@latest

# 2. Test manually
pnpm dev  # Start dev server

# In another terminal
claude -p "Use playwright to navigate to http://localhost:5173 and describe what you see"
```

### Phase 2: GitHub Actions Prototype

1. Create `.github/workflows/claude-smoke-test.yml` using Option B above
2. Add `ANTHROPIC_API_KEY` to repository secrets
3. Test on a draft PR

### Phase 3: Iterate Based on Results

- Monitor execution times and costs
- Adjust prompts based on actual failures
- Consider moving to Option A if curl-based tests are insufficient

## Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Option A (Playwright MCP)** | Full browser automation, visual testing | Complex setup, higher cost, less reliable |
| **Option B (Claude Action + curl)** | Simple, fast, deterministic | Limited to HTTP checks, no real UI testing |
| **Option C (Hybrid)** | Best of both worlds, cost-effective | More maintenance, two systems to manage |

## Cost Estimate

| Scenario | Estimated Cost per PR |
|----------|----------------------|
| Simple curl checks (Option B) | ~$0.01-0.05 |
| Full Playwright MCP (Option A) | ~$0.10-0.50 |
| Manual trigger only | $0 (when not triggered) |

## Security Considerations

- Store `ANTHROPIC_API_KEY` as GitHub Secret
- Limit tool access with `--allowedTools`
- Never expose API keys in logs
- Review AI-generated comments before acting on them
- Set spend limits in Anthropic console

## Sources

### Official Documentation
- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)
- [Claude Code Headless Mode](https://code.claude.com/docs/en/headless)
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)

### Guides & Tutorials
- [Using Playwright MCP with Claude Code - Simon Willison](https://til.simonwillison.net/claude-code/playwright-mcp-claude-code)
- [How to Integrate Claude Code with CI/CD - 2025 Guide](https://skywork.ai/blog/how-to-integrate-claude-code-ci-cd-guide-2025/)
- [Claude Code Best Practices - Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)

### Related Resources
- [GitHub's Official MCP Server](https://github.com/github/github-mcp-server)
- [Playwright MCP Guide - Supatest](https://supatest.ai/blog/playwright-mcp-setup-guide)
- [Testing with Playwright and Claude Code](https://nikiforovall.blog/ai/2025/09/06/playwright-claude-code-testing.html)
