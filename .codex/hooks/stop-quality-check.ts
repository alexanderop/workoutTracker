#!/usr/bin/env pnpm dlx tsx
/**
 * Claude Code Stop Hook - Quality Check
 *
 * Runs type checking, ESLint, and unit tests when Claude stops to ensure code quality.
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { cwd, env, exit, stderr, stdout } from 'node:process'

// Type from @anthropic-ai/claude-agent-sdk
type StopHookInput = {
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string
  hook_event_name: 'Stop'
  stop_hook_active: boolean
}

function readStdin(): string {
  return readFileSync(0, 'utf-8')
}

function runCommand(command: string, label: string): { success: boolean, output: string } {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: env.CLAUDE_PROJECT_DIR || cwd(),
    })
    return { success: true, output }
  }
  catch (error) {
    const execError = error as { stdout?: string, stderr?: string }
    return {
      success: false,
      output: execError.stdout || execError.stderr || `${label} failed`,
    }
  }
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

  // Validate input is a stop hook
  const input = parsedInput as StopHookInput
  if (!input || typeof input !== 'object') {
    exit(0)
  }

  const results: Array<string> = []
  let hasErrors = false

  // Run format first (before other checks)
  const format = runCommand('pnpm format', 'Format')
  if (format.success) {
    results.push('✅ Format completed')
  }
  else {
    hasErrors = true
    results.push('❌ Format failed:', format.output)
  }

  // Run type check
  const typeCheck = runCommand('pnpm type-check', 'Type check')
  if (typeCheck.success) {
    results.push('✅ Type check passed')
  }
  else {
    hasErrors = true
    results.push('❌ Type check failed:', typeCheck.output)
  }

  // Run ESLint
  const eslint = runCommand('pnpm lint:eslint', 'ESLint')
  if (eslint.success) {
    results.push('✅ ESLint check passed')
  }
  else {
    hasErrors = true
    results.push('❌ ESLint check failed:', eslint.output)
  }

  // Run unit tests
  const unitTests = runCommand('pnpm test:unit --run', 'Unit tests')
  if (unitTests.success) {
    results.push('✅ Unit tests passed')
  }
  else {
    hasErrors = true
    results.push('❌ Unit tests failed:', unitTests.output)
  }

  // Output results
  const output = results.join('\n')
  if (hasErrors) {
    const fixPrompt = `\n\n🔧 QUALITY CHECK FAILED\n\nFix all the errors shown above. Do not stop until all checks pass.\n`
    stderr.write(output + fixPrompt)
    exit(1)
  }
  else {
    stdout.write(output)
    exit(0)
  }
}

main()
