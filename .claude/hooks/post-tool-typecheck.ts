#!/usr/bin/env pnpm dlx tsx
/**
 * Claude Code PostToolUse Hook - Batched Type Check
 *
 * Runs type-check after every 5 file edits to provide feedback
 * without blocking every single edit operation.
 */

import type { HookEventName, PostToolUseHookInput } from '@anthropic-ai/claude-agent-sdk'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cwd, env, exit, stdout } from 'node:process'

type SyncHookJSONOutput = {
  hookSpecificOutput?: {
    hookEventName: HookEventName
    feedback?: string
  }
}

const BATCH_SIZE = 5
const STATE_FILE = join(tmpdir(), 'claude-typecheck-count')

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.mts', '.cts']

function readStdin(): string {
  return readFileSync(0, 'utf-8')
}

function isCodeFile(filePath: string): boolean {
  return CODE_EXTENSIONS.some((ext) => filePath.endsWith(ext))
}

function getEditCount(): number {
  if (!existsSync(STATE_FILE)) {
    return 0
  }
  const content = readFileSync(STATE_FILE, 'utf-8').trim()
  const count = parseInt(content, 10)
  return isNaN(count) ? 0 : count
}

function setEditCount(count: number): void {
  writeFileSync(STATE_FILE, String(count), 'utf-8')
}

function runTypeCheck(): { success: boolean; output: string } {
  try {
    const output = execSync('pnpm vue-tsc --build', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: env.CLAUDE_PROJECT_DIR || cwd(),
    })
    return { success: true, output }
  }
  catch (error) {
    const execError = error as { stdout?: string; stderr?: string }
    return {
      success: false,
      output: execError.stdout || execError.stderr || 'Type check failed',
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

  const input = parsedInput as PostToolUseHookInput

  // Only track Edit and Write tools
  if (input.tool_name !== 'Edit' && input.tool_name !== 'Write') {
    exit(0)
  }

  // Check if it's a code file
  const toolInput = input.tool_input as { file_path?: string }
  const filePath = toolInput.file_path
  if (!filePath || !isCodeFile(filePath)) {
    exit(0)
  }

  // Increment edit count
  const currentCount = getEditCount() + 1

  // Check if we've reached the batch size
  if (currentCount < BATCH_SIZE) {
    setEditCount(currentCount)
    exit(0)
  }

  // Reset counter and run type check
  setEditCount(0)

  const result = runTypeCheck()

  if (result.success) {
    // Type check passed - provide positive feedback
    const output: SyncHookJSONOutput = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        feedback: `✅ Type check passed (after ${BATCH_SIZE} edits)`,
      },
    }
    stdout.write(JSON.stringify(output))
    exit(0)
  }

  // Type check failed - provide error feedback
  const output: SyncHookJSONOutput = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      feedback: `⚠️ Type check found errors (after ${BATCH_SIZE} edits):\n\n${result.output}\n\nPlease review and fix these type errors.`,
    },
  }
  stdout.write(JSON.stringify(output))
  exit(0)
}

main()
