#!/usr/bin/env npx tsx
/**
 * Claude Code PreToolUse Hook - Protect shadcn/ui Components
 *
 * Blocks editing of shadcn/ui components in src/components/ui/
 * These should be managed through the shadcn CLI
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

  // Only check Write and Edit tools
  if (input.tool_name !== 'Write' && input.tool_name !== 'Edit') {
    exit(0)
  }

  const toolInput = input.tool_input as { file_path?: string }
  const filePath = toolInput.file_path

  if (!filePath) {
    exit(0)
  }

  // Check if file is in src/components/ui/
  if (filePath.includes('src/components/ui/')) {
    const output: SyncHookJSONOutput = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: '🚫 BLOCKED: Cannot edit shadcn/ui components directly. Use `npx shadcn-vue@latest add` or `npx shadcn-vue@latest update` to manage components in src/components/ui/',
      },
    }
    stdout.write(JSON.stringify(output))
    exit(0)
  }

  // File is safe to edit
  exit(0)
}

main()
