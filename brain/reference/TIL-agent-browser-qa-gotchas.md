---
type: Reference
title: "TIL: Agent Browser QA Gotchas"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/TIL-agent-browser-qa-gotchas.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## TIL: Agent Browser QA Gotchas

Notes from exploratory QA with the `agent-browser` CLI.

## Prefer Plain Sessions for This App

Custom `--profile` paths can leave the app root empty in `agent-browser` even when Vite serves all modules and no browser exception is reported. If a page only shows the Vue DevTools toggle and `#app` has no children:

1. Run `agent-browser close --all`.
2. Reopen with a plain named session: `agent-browser --session workouttracker-qa open http://localhost:<port>/`.
3. Verify with `agent-browser --session workouttracker-qa eval "document.querySelector('#app')?.childElementCount"`.

Do not treat the blank custom-profile mount as a product bug until it reproduces in a plain session.

## Refs Can Be Flaky on Long Interactive Surfaces

On long scrollable lists and role-based cards, `agent-browser click @ref` can hit the wrong element or fail to trigger the intended Vue handler. When the rendered UI looks correct but the click result is suspicious, re-test with a precise page-context click:

```bash
agent-browser --session workouttracker-qa eval \
  "Array.from(document.querySelectorAll('[role=button], button')).find((el) => el.textContent?.includes('Bench Press'))?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))"
```

Record this as a tooling caveat unless the exact DOM click also fails.
