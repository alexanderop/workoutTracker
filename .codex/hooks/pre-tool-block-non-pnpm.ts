#!/usr/bin/env pnpm dlx tsx
/**
 * Claude Code PreToolUse Hook - Enforce pnpm Only
 *
 * Blocks npm, yarn, and bun commands. Only pnpm is allowed.
 */

import type { PreToolUseHookInput, SyncHookJSONOutput } from '@anthropic-ai/claude-agent-sdk'
import { readFileSync } from 'node:fs'
import { exit, stdout } from 'node:process'

function readStdin(): string {
  return readFileSync(0, 'utf-8')
}

function main(): void {
  const rawInput = readStdin()

  let parsedInput: unknown
  try {
    parsedInput = JSON.parse(rawInput)
  }
  catch {
    exit(0)
  }

  const input = parsedInput as PreToolUseHookInput

  // Only check Bash tool
  if (input.tool_name !== 'Bash') {
    exit(0)
  }

  const toolInput = input.tool_input as { command?: string }
  const command = toolInput.command || ''

  // Check for forbidden package managers at the start of command
  // Uses word boundary to avoid false positives like "echo npm"
  const forbiddenPatterns = [
    /^\s*npm\b/,
    /^\s*yarn\b/,
    /^\s*bun\b/,
  ]

  const isForbidden = forbiddenPatterns.some(pattern => pattern.test(command))

  if (isForbidden) {
    const output: SyncHookJSONOutput = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Only pnpm is allowed as the package manager. Use pnpm instead of npm, yarn, or bun.',
      },
    }
    stdout.write(JSON.stringify(output))
    exit(0)
  }

  // Command is allowed
  exit(0)
}

main()
