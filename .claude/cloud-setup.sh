#!/bin/bash
# Reference copy of the "Setup script" configured on the Claude Code cloud
# environment. This file is NOT executed by the repo — paste its contents into
# the environment's Setup script field. It lives here so the setting is
# reviewable and versioned instead of only existing in the web UI.
#
# Runs once as root, before Claude Code launches. The resulting filesystem is
# snapshotted and reused; the script only re-runs when it changes, when the
# network allowlist changes, or when the ~7-day cache expires. Never exit
# non-zero — a failing setup script stops the session from starting.
set -uo pipefail

REPO=$(find /home/user -maxdepth 3 -name pnpm-lock.yaml -not -path '*/node_modules/*' \
  -printf '%h\n' 2>/dev/null | head -n 1)
[ -n "$REPO" ] && cd "$REPO" || exit 0

corepack enable >/dev/null 2>&1 || true

# Bake node_modules into the snapshot so sessions start with deps present.
# .claude/hooks/cloud-bootstrap.sh re-runs this per session to pick up lockfile
# drift; with a warm store that reconcile is seconds rather than a cold install.
pnpm install --frozen-lockfile --prefer-offline || true

# The base image ships a Chromium revision that does not match the pinned
# playwright version, and Vitest browser mode refuses to launch on a mismatch.
# No --with-deps: the system libraries are already present in the image, and
# apt hosts are not on the default network allowlist.
pnpm exec playwright install chromium || true

exit 0
