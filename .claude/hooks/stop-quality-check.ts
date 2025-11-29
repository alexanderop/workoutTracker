#!/usr/bin/env npx tsx
/**
 * Claude Code Stop Hook - Quality Check
 *
 * Runs type checking and ESLint when Claude stops to ensure code quality.
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { cwd, env, exit, stderr, stdout } from 'node:process'

// Type from @anthropic-ai/claude-agent-sdk
interface StopHookInput {
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

  const results: string[] = []
  let hasErrors = false

  // Run type check
  const typeCheck = runCommand('pnpm type-check', 'Type check')
  if (!typeCheck.success) {
    hasErrors = true
    results.push('❌ Type check failed:')
    results.push(typeCheck.output)
  }
  else {
    results.push('✅ Type check passed')
  }

  // Run ESLint
  const eslint = runCommand('pnpm lint:eslint', 'ESLint')
  if (!eslint.success) {
    hasErrors = true
    results.push('❌ ESLint check failed:')
    results.push(eslint.output)
  }
  else {
    results.push('✅ ESLint check passed')
  }

  // Output results
  const output = results.join('\n')
  if (hasErrors) {
    stderr.write(output)
    exit(1)
  }
  else {
    stdout.write(output)
    exit(0)
  }
}

main()
