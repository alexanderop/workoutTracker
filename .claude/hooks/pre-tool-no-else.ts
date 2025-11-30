#!/usr/bin/env pnpm dlx tsx
/**
 * Claude Code PreToolUse Hook - No else/if-else
 *
 * Blocks code that uses `else` or `if-else` statements.
 * Requires early returns or ternary operators instead.
 */

import type { PreToolUseHookInput, SyncHookJSONOutput } from '@anthropic-ai/claude-agent-sdk'
import { readFileSync } from 'node:fs'
import { exit, stdout } from 'node:process'

function readStdin(): string {
  return readFileSync(0, 'utf-8')
}

type WriteToolInput = {
  file_path?: string
  content?: string
}

type EditToolInput = {
  file_path?: string
  new_string?: string
}

function isCodeFile(filePath: string): boolean {
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.mts', '.cts']
  return codeExtensions.some((ext) => filePath.endsWith(ext))
}

function findElsePatterns(content: string): ReadonlyArray<string> {
  const violations: Array<string> = []

  // Pattern for standalone else
  // Matches: } else { or } else if
  const elsePattern = /}\s*else\s*[{(if]/g

  // Find all matches
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip comments
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue
    }

    // Check for else patterns
    if (elsePattern.test(line)) {
      violations.push(`Line ${i + 1}: "${trimmed}"`)
      elsePattern.lastIndex = 0 // Reset regex
      continue
    }

    // Also check for else on its own line
    if (/^\s*}\s*else\s*$/.test(line) || /^\s*else\s*[{]?\s*$/.test(line)) {
      violations.push(`Line ${i + 1}: "${trimmed}"`)
    }
  }

  return violations
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

  const toolInput = input.tool_input as WriteToolInput | EditToolInput

  const filePath = toolInput.file_path
  if (!filePath) {
    exit(0)
  }

  // Only check code files
  if (!isCodeFile(filePath)) {
    exit(0)
  }

  // Get the content to check
  let contentToCheck: string | undefined
  if (input.tool_name === 'Write') {
    contentToCheck = (toolInput as WriteToolInput).content
  }
  if (input.tool_name === 'Edit') {
    contentToCheck = (toolInput as EditToolInput).new_string
  }

  if (!contentToCheck) {
    exit(0)
  }

  const violations = findElsePatterns(contentToCheck)

  if (violations.length > 0) {
    const output: SyncHookJSONOutput = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `🚫 BLOCKED: Code contains 'else' or 'if-else' statements. Use early returns or ternary operators instead.\n\nViolations found:\n${violations.join('\n')}\n\nRefactor using:\n- Early return: if (condition) return x; /* rest of code */\n- Ternary: condition ? valueA : valueB`,
      },
    }
    stdout.write(JSON.stringify(output))
    exit(0)
  }

  // Code is safe
  exit(0)
}

main()
