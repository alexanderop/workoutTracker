---
description: Close all open pull requests
allowed-tools: Bash(gh pr list:*), Bash(gh pr close:*)
---

# Close All Open PRs

I have gathered information about open pull requests:

<open_prs>
!`gh pr list --state open`
</open_prs>

## Instructions

1. **Review the list** of open PRs above.
2. **Close each PR** by running `gh pr close <number>` for each one.
3. **Report results** showing which PRs were closed.

If there are no open PRs, inform the user that there's nothing to close.
