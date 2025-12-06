# Research: GitHub Actions Pipeline Optimization

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

The current CI pipeline runs lint, knip, type-check, build, and test jobs for a Vue 3 PWA with pnpm and Playwright browser testing. The goal is to identify optimization opportunities to reduce CI time and costs while maintaining reliability.

## Current Pipeline Analysis

**File:** `.github/workflows/ci.yml` (179 lines)

### What the Pipeline Does Well

| Practice | Status |
|----------|--------|
| Concurrency with `cancel-in-progress` | Implemented |
| Job timeouts | Implemented (5-15 min) |
| Path filtering | Implemented |
| `--frozen-lockfile` and `--prefer-offline` | Implemented |
| pnpm store caching | Implemented |
| TypeScript and Vite build caching | Implemented |
| Minimal permissions (`contents: read`) | Implemented |

### Current Job Structure

| Job | Timeout | Dependencies | Runs in Parallel |
|-----|---------|--------------|------------------|
| lint | 10 min | None | Yes |
| knip | 10 min | None | Yes |
| type-check | 10 min | None | Yes |
| build | 10 min | type-check | No (sequential) |
| test | 15 min | None | Yes |

### Identified Bottlenecks

1. **Playwright browser installation** runs on every CI execution (~3-5 minutes)
2. **Redundant pnpm install** executes in all 5 jobs independently
3. **No Playwright caching** for browser binaries at `~/.cache/ms-playwright`

## Key Findings

### 1. Playwright Browser Caching (High Impact)

Installing Playwright browsers with `--with-deps` takes 3-5 minutes per run. Caching browser binaries can reduce this to ~20-40 seconds.

**Recommended configuration:**

```yaml
- name: Get Playwright version
  id: playwright-version
  run: echo "version=$(pnpm list @playwright/test --depth=0 --json | jq -r '.[0].dependencies["@playwright/test"].version')" >> $GITHUB_OUTPUT

- name: Cache Playwright browsers
  uses: actions/cache@v4.2.3
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}
    restore-keys: |
      playwright-${{ runner.os }}-

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: pnpm exec playwright install chromium --with-deps

- name: Install Playwright system dependencies (cache hit)
  if: steps.playwright-cache.outputs.cache-hit == 'true'
  run: pnpm exec playwright install-deps chromium
```

**Expected savings:** 2-4 minutes per run

### 2. Deduplicate pnpm Install (Medium Impact)

Each job runs `pnpm install` independently. Adding a shared setup job that caches `node_modules` eliminates redundant installs.

**Pattern:**

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4.2.2
      - uses: pnpm/action-setup@v4.1.0
      - uses: actions/setup-node@v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile --prefer-offline
      - uses: actions/cache/save@v4.2.3
        with:
          path: node_modules
          key: node-modules-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

  lint:
    needs: setup
    steps:
      - uses: actions/cache/restore@v4.2.3
        with:
          path: node_modules
          key: node-modules-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
      - run: pnpm lint
```

**Expected savings:** 30-60 seconds total across jobs

### 3. GitHub Actions Updates (Critical for March 2025)

**Breaking changes effective March 1, 2025:**
- `actions/cache` v1-v2 will fail (already using v4.2.3)
- `@actions/cache` npm package <4.0.0 will fail
- `actions/upload-artifact` and `actions/download-artifact` v1-v3 deprecated

**Your pipeline is already compliant** with these updates.

### 4. Cache Service v2 (Performance)

GitHub completely rewrote the cache backend service (February 2025), providing:
- Improved performance and reliability
- Repository cache limit can now exceed 10GB
- Better cache eviction policies

No action required—benefits are automatic.

### 5. Optional Improvements

| Improvement | Impact | Complexity |
|-------------|--------|------------|
| Add fail-fast to matrix strategy | Saves time on failures | Low |
| Workflow telemetry (`catchpoint/workflow-telemetry-action`) | Monitoring only | Low |
| Vitest result caching with `vite-plugin-vitest-cache` | 30-50% test time reduction | Medium |
| Self-hosted runners | Cost savings at scale | High |

## Codebase Patterns

The current workflow follows these patterns:

1. **Caching pattern:** Uses `actions/cache@v4.2.3` with `continue-on-error: true` for soft cache failures
2. **Dependency resolution:** Uses `pnpm/action-setup@v4.1.0` with `actions/setup-node@v4.4.0`
3. **Artifact storage:** Uses `actions/upload-artifact@v4.6.2` with 7-day retention
4. **Path filtering:** Monitors `src/`, config files, and workflow changes

## Recommended Approach

### Priority 1: Add Playwright Browser Caching

Modify the test job to cache Playwright browsers. This provides the highest impact with minimal risk.

### Priority 2: Add Setup Job for node_modules Caching

Create a shared setup job that caches `node_modules` and have all other jobs restore from this cache. This eliminates 4 redundant `pnpm install` commands.

### Priority 3: Reduce Job Timeouts

Current timeouts may be conservative:
- lint: 10 min → 5 min
- knip: 10 min → 5 min
- type-check: 10 min → 5 min
- build: 10 min → 5 min
- test: 15 min → 10 min (with Playwright caching)

### Expected Results

| Metric | Current | After Optimization |
|--------|---------|-------------------|
| Total CI time | ~8-12 min | ~3-5 min |
| pnpm install calls | 5 | 1 |
| Playwright install time | 3-5 min | 20-40 sec |
| Estimated savings | - | ~60% time reduction |

## Sources

### Performance Optimization
- [GitHub Actions Caching and Performance Optimization | Medium](https://medium.com/@amareswer/github-actions-caching-and-performance-optimization-38c76ac29151)
- [Optimizing GitHub Actions Workflows for Speed and Efficiency](https://marcusfelling.com/blog/2025/optimizing-github-actions-workflows-for-speed)
- [GitHub Actions Cache - A Complete Guide | CICube](https://cicube.io/blog/github-actions-cache/)

### Playwright Caching
- [How To Cache Playwright Browser On GitHub Actions](https://dev.to/ayomiku222/how-to-cache-playwright-browser-on-github-actions-51o6)
- [Caching Playwright Binaries in GitHub Actions](https://justin.poehnelt.com/posts/caching-playwright-in-github-actions/)
- [Continuous Integration | Playwright](https://playwright.dev/docs/ci)

### pnpm Best Practices
- [Continuous Integration | pnpm](https://pnpm.io/continuous-integration)
- [GitHub - pnpm/action-setup](https://github.com/pnpm/action-setup)
- [PNPM GitHub Actions Cache](https://theodorusclarence.com/shorts/github/pnpm-github-actions-cache)

### GitHub Updates
- [Notice of upcoming releases and breaking changes for GitHub Actions](https://github.blog/changelog/2024-12-05-notice-of-upcoming-releases-and-breaking-changes-for-github-actions/)
- [New releases for GitHub Actions - November 2025](https://github.blog/changelog/2025-11-06-new-releases-for-github-actions-november-2025/)

### Cost Optimization
- [How to reduce spend in GitHub Actions | Blacksmith](https://www.blacksmith.sh/blog/how-to-reduce-spend-in-github-actions)
- [How to reduce costs for GitHub Actions? | cloudonaut](https://cloudonaut.io/how-to-reduce-costs-for-github-actions/)
