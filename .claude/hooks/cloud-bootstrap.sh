#!/bin/bash
# Cloud sessions start from a fresh clone against a cached environment snapshot,
# so node_modules and the Playwright browser can both be stale or missing. Vitest
# runs in browser mode, which means a browser mismatch fails the whole suite
# before a single test executes. Reconcile both at session start.
#
# Local sessions manage their own install, so this is a no-op off the cloud.
set -uo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 ||
  echo "cloud-bootstrap: pnpm install failed — run it manually before testing."

pnpm exec playwright install chromium >/dev/null 2>&1 ||
  echo "cloud-bootstrap: playwright chromium install failed — browser tests cannot run."

exit 0
