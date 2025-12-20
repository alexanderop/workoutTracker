#!/usr/bin/env pnpm dlx tsx
/**
 * Claude Code UserPromptSubmit Hook - Skill Auto-Activation
 *
 * Automatically injects relevant skill content when user prompts
 * match defined trigger keywords from skill-rules.json.
 *
 * Suppression: Add --no-skill or --skip-skills to skip activation.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { exit, stdout } from 'node:process'

interface HookInput {
  prompt: string
  cwd: string
  session_id: string
  hook_event_name: string
}

interface SkillRule {
  name: string
  path: string
  triggers: ReadonlyArray<string>
}

function readStdin(): string {
  return readFileSync(0, 'utf-8')
}

function main(): void {
  const rawInput = readStdin()
  let input: HookInput

  try {
    input = JSON.parse(rawInput) as HookInput
  }
  catch {
    exit(0) // Invalid input, pass through
  }

  const prompt = input.prompt || ''

  // Check for suppression flag
  if (/--no-skill|--skip-skills?/i.test(prompt)) {
    exit(0) // Skip activation
  }

  // Load skill rules
  const rulesPath = join(input.cwd, '.claude/hooks/skill-rules.json')
  if (!existsSync(rulesPath)) {
    exit(0)
  }

  let rules: ReadonlyArray<SkillRule>
  try {
    rules = JSON.parse(readFileSync(rulesPath, 'utf-8')) as ReadonlyArray<SkillRule>
  }
  catch {
    exit(0) // Invalid rules file
  }

  const matchedSkills: Array<{ name: string; content: string }> = []

  // Match triggers (case-insensitive regex)
  for (const rule of rules) {
    const isMatch = rule.triggers.some((trigger) => {
      try {
        const regex = new RegExp(trigger, 'i')
        return regex.test(prompt)
      }
      catch {
        // Invalid regex pattern, try literal match
        return prompt.toLowerCase().includes(trigger.toLowerCase())
      }
    })

    if (isMatch) {
      const skillPath = join(input.cwd, rule.path)
      if (existsSync(skillPath)) {
        const content = readFileSync(skillPath, 'utf-8')
        matchedSkills.push({ name: rule.name, content })
      }
    }
  }

  // Output matched skills
  if (matchedSkills.length > 0) {
    const output: Array<string> = []
    output.push('\n=== Auto-Activated Skills ===')
    output.push(`Skills activated: ${matchedSkills.map((s) => s.name).join(', ')}\n`)

    for (const skill of matchedSkills) {
      output.push(`--- ${skill.name} ---`)
      output.push(skill.content)
      output.push('')
    }
    output.push('=== End Skills ===\n')

    stdout.write(output.join('\n'))

    // User-visible notification
    process.stderr.write(`\x1b[36m⚡ Skills: ${matchedSkills.map((s) => s.name).join(', ')}\x1b[0m\n`)
  }

  exit(0)
}

main()
