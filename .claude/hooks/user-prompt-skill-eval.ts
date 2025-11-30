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

Step 1 - EVALUATE (do this in your response):
For each skill in <available_skills>, state: [skill-name] - YES/NO - [reason]

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
