---
name: research
description: Deep research on a technical problem using parallel agents for official documentation and codebase exploration. Keep reports temporary unless the user requests a tracked artifact; add brain notes only for durable decisions or non-obvious project gotchas.
allowed-tools: Task, WebSearch, WebFetch, Grep, Glob, Read, Write, Bash
---

# Research: $ARGUMENTS

Research the requested problem like a senior developer.

## Gather evidence

Launch parallel agents for:

1. Official documentation and primary sources.
2. Relevant issue discussions or community evidence.
3. Existing codebase patterns and constraints.

Prefer primary sources, flag version-specific or conflicting information, and
separate sourced facts from inference.

## Report

Return a concise answer with:

- problem statement;
- key findings;
- codebase implications;
- recommended approach and tradeoffs; and
- source links.

Do not add a tracked research report by default. If working notes are useful,
write them under `tmp/research/`, which is disposable. Create a tracked artifact
only when the user requests one and use the path they specify.

Add or update a `brain/` note only when the result meets `brain/index.md`:
a durable architectural decision or a project-specific failure mode that
cannot be encoded more reliably in code or tests.
