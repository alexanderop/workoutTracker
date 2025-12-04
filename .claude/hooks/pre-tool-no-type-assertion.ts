#!/usr/bin/env pnpm dlx tsx
/**
 * Claude Code PreToolUse Hook - No Type Assertions
 *
 * Blocks ALL type assertions (`as SomeType`).
 * Excludes: import/export aliases, .claude/hooks/ directory.
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

function findTypeAssertionViolations(content: string): ReadonlyArray<string> {
  const violations: Array<string> = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue
    }

    // Skip import/export statements (they use `as` for aliases)
    if (/^(import|export)\b/.test(trimmed)) {
      continue
    }

    // Remove string literals to avoid false positives
    const withoutStrings = line
      .replace(/'[^']*'/g, "''")
      .replace(/"[^"]*"/g, '""')
      .replace(/`[^`]*`/g, '``')

    // Match type assertions: `as TypeName` patterns
    // Catches: `expr as SomeType`, `(value) as Type`, `x as Type[]`, `x as Type<T>`
    if (/\bas\s+[A-Z][a-zA-Z0-9<>[\]|&,\s]*/.test(withoutStrings)) {
      violations.push(`Line ${i + 1}: Found type assertion - "${trimmed}"`)
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

  // Skip hook files (they need type assertions for parsing)
  if (filePath.includes('.claude/hooks/')) {
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

  const violations = findTypeAssertionViolations(contentToCheck)

  if (violations.length > 0) {
    const output: SyncHookJSONOutput = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `🚫 BLOCKED: Code contains type assertions.\n\nViolations found:\n${violations.join('\n')}\n\nInstead of type assertions, use:\n- Proper type definitions\n- Type guards (if/typeof/instanceof checks)\n- Generic type parameters\n- Zod or similar runtime validation`,
      },
    }
    stdout.write(JSON.stringify(output))
    exit(0)
  }

  // Code is safe
  exit(0)
}

main()
