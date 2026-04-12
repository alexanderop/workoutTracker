---
name: research
description: Deep research on a technical problem using parallel subagents for web docs, Stack Overflow, and codebase exploration, saving a markdown report to docs/research/. Use when the user says "research X", "investigate X", "find out how X works", or needs evidence-based recommendations before implementing.
allowed-tools: Task, WebSearch, WebFetch, Grep, Glob, Read, Write, Bash
---

# Research: $ARGUMENTS

Research the following problem or question:

> **$ARGUMENTS**

## Instructions

Conduct thorough research like a senior developer. Launch multiple subagents in parallel to gather information from different sources.

### Step 1: Launch Parallel Research Agents

Use the Task tool to spawn these subagents **in parallel** (all in a single message):

1. **Web Documentation Agent** (subagent_type: general-purpose)
   - Search official documentation for the topic
   - Find best practices and recommended patterns
   - Locate relevant GitHub issues or discussions

2. **Stack Overflow Agent** (subagent_type: general-purpose)
   - Search Stack Overflow for similar problems and solutions
   - Find highly-voted and accepted answers
   - Note common pitfalls and gotchas

3. **Codebase Explorer Agent** (subagent_type: Explore)
   - Search the codebase for related patterns
   - Find existing solutions to similar problems
   - Identify relevant files, functions, or components

### Step 2: Create Research Document

After all agents complete, create a markdown file at `docs/research/<topic-slug>.md`.

Generate the filename from the research topic:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Add today's date as prefix: `YYYY-MM-DD-<topic-slug>.md`

Example: "Vue 3 Suspense" → `docs/research/2024-12-06-vue-3-suspense.md`

First, create the research folder if it doesn't exist:
```bash
mkdir -p docs/research
```

### Step 3: Write the Research Document

Structure the document with these sections:

```markdown
# Research: <Topic>

**Date:** <YYYY-MM-DD>
**Status:** Complete

## Problem Statement

<Describe the problem and why it matters>

## Key Findings

<Summarize the most relevant solutions and approaches>

## Codebase Patterns

<Document how the current codebase handles similar cases>

## Recommended Approach

<Provide your recommendation based on all research>

## Sources

- [Source Title](URL) - Brief description
- [Source Title](URL) - Brief description
```

### Guidelines

- Prioritize official documentation over blog posts
- Prefer solutions that match existing codebase patterns
- Note version-specific considerations (Vue 3, TypeScript, etc.)
- Flag conflicting information across sources
- Write concise, actionable content
- Use active voice throughout the document

### Step 4: Confirm Completion

After writing the file, output the file path so the user can find it later.
