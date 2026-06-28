---
type: Brain Format
title: OKF-inspired brain note format
description: Required structure for knowledge files in the repo brain.
resource: brain/format.md
tags: [brain, okf, documentation]
timestamp: 2026-06-28T08:05:00Z
---

## OKF-Inspired Brain Note Format

The brain follows the Open Knowledge Format idea from the pasted reference:
plain markdown files with small YAML frontmatter, normal links, optional indexes,
and an optional chronological log.

## Required Frontmatter

Every brain concept file starts with:

```yaml
---
type: Principle
title: Example title
description: One sentence explaining the note.
resource: brain/path/to/file.md
tags: [brain, example]
timestamp: 2026-06-28T08:05:00Z
---
```

Field meanings:

| Field | Meaning |
|-------|---------|
| `type` | Kind of concept, such as `Principle`, `Domain Map`, `Lesson`, or `Plan Index`. |
| `title` | Human-readable title. |
| `description` | Short summary for search results and agent routing. |
| `resource` | The repo-relative path or external URL this note describes. |
| `tags` | Stable query terms. Prefer lowercase kebab-case. |
| `timestamp` | Last meaningful update time in ISO 8601 UTC. |

## Body Rules

- Use the frontmatter `title` as the document's H1. The visible body heading
  should start at `##` because this repo's markdownlint config treats
  frontmatter titles as top-level headings.
- Keep one concept per file.
- Link to canonical code and docs instead of copying large sections.
- Use indexes for navigation and summaries; use concept files for decisions and
  gotchas.
- When a note comes from another location, say so in the body and remove or
  redirect the old location when that is safe.

## Folder Roles

| Folder | Purpose |
|--------|---------|
| `principles/` | Durable engineering judgment and tie-breakers. |
| `domains/` | Maps from a task area to docs, source files, and verification. |
| `lessons/` | Specific remembered gotchas from previous sessions. |
| `plans/` | Plans that agents may continue or audit. |

## Maintenance Rule

When you learn something non-obvious during a task, either update the matching
brain note or link the matching `brain/reference/` file from a domain note. The
brain should route agents to current truth, not compete with it.
