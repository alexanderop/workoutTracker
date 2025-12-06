#!/usr/bin/env pnpm dlx tsx
/**
 * Claude Code UserPromptSubmit Hook - Force Skill Evaluation
 *
 * Forces Claude to explicitly evaluate each skill before proceeding,
 * improving skill activation rates from ~20% to ~84%.
 */

import { readFileSync } from 'node:fs'
import { stdout } from 'node:process'

function readStdin(): string {
  return readFileSync(0, 'utf-8')
}

function main(): void {
  // Read input (not strictly needed for this hook, but keeps pattern consistent)
  readStdin()

  const instruction = `
INSTRUCTION: MANDATORY SKILL ACTIVATION SEQUENCE

Available skills:
- brainstorm: Refine rough ideas into designs through collaborative questioning
- frontend-design: Create distinctive, production-grade frontend interfaces
- git-worktree: Set up parallel development workspaces using git worktree
- shadcn-vue-docs: Fetch and answer questions about shadcn-vue components
- skill-creator: Guide for creating effective skills
- tdd-integration: Enforce TDD with strict Red-Green-Refactor cycle
- vitest-docs: Vitest documentation reference
- vitest-mocking: Vitest mocking patterns and techniques
- vue-composables: Write high-quality Vue 3 composables
- vue-composable-testing: Test Vue 3 composables with Vitest
- vue-integration-testing: Write Vue 3 integration tests using Testing Library
- writingPlan: Create detailed implementation plans for engineers

Step 1 - EVALUATE (do this in your response):
For each skill above, state: [skill-name] - YES/NO - [reason]

Step 2 - ACTIVATE (do this immediately after Step 1):
IF any skills are YES → Use Skill(skill-name) tool for EACH relevant skill NOW
IF no skills are YES → State "No skills needed" and proceed

Step 3 - IMPLEMENT:
Only after Step 2 is complete, proceed with implementation.

CRITICAL: You MUST call Skill() tool in Step 2. Do NOT skip to implementation.
The evaluation (Step 1) is WORTHLESS unless you ACTIVATE (Step 2) the skills.

Example of correct sequence:
- brainstorm: NO - not a brainstorming task
- vue-composables: YES - need to create composable
- vue-composable-testing: YES - need to test composable

[Then IMMEDIATELY use Skill() tool:]
> Skill(vue-composables)
> Skill(vue-composable-testing)

[THEN and ONLY THEN start implementation]
`

  stdout.write(instruction.trim())
}

main()
