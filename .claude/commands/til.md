---
description: Extract and save key learnings from current conversation
allowed-tools: Write
---

# TIL (Today I Learned)

<current_date>
!`date +%Y-%m-%d`
</current_date>

Analyze this conversation and extract 1-3 key learnings.

## Output Format

For each learning, create a short bullet:
- **[Topic]**: [One sentence insight]

Example:
- **Composable commands**: Slash commands can delegate to other commands by instructing to execute them

## What to Look For

- Patterns discovered
- Mistakes made and corrected
- New techniques or approaches
- Codebase-specific insights
- Things that surprised you or the user

## Save

Write the TILs to `.claude/memory/til-<current_date>-[slug].md` using the date above. Format:

```markdown
# TIL: [Short title]

- **[Topic 1]**: [Insight]
- **[Topic 2]**: [Insight]

## Context
[1-2 sentences about what we were working on]
```
