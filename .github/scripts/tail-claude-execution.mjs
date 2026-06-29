#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { appendFileSync } from 'node:fs'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1])
}

const candidates = (
  args.get('--candidates') ??
  '/home/runner/work/_temp/claude-execution-output.json:/tmp/claude-execution-output.json'
)
  .split(':')
  .filter(Boolean)
const outFile = args.get('--out')
const intervalMs = Number(args.get('--interval-ms') ?? '5000')
const heartbeatMs = Number(args.get('--heartbeat-ms') ?? '30000')
const maxInputLength = Number(args.get('--max-input-length') ?? '220')

const seenTools = new Set()
let lastHeartbeat = 0
let lastKnownPath = ''
let lastRecordCount = 0
let lastToolSummary = 'none yet'
let stopping = false

process.on('SIGTERM', () => {
  stopping = true
})
process.on('SIGINT', () => {
  stopping = true
})

function writeLine(line) {
  process.stdout.write(`${line}\n`)
  if (outFile) {
    appendFileSync(outFile, `${line}\n`)
  }
}

function redact(value) {
  return String(value)
    .replaceAll(/gh[pousr]_[A-Za-z0-9_]{20,}/g, '[REDACTED_GITHUB_TOKEN]')
    .replaceAll(/github_pat_[A-Za-z0-9_]+/g, '[REDACTED_GITHUB_TOKEN]')
    .replaceAll(/sk-ant-[A-Za-z0-9_-]+/g, '[REDACTED_ANTHROPIC_KEY]')
    .replaceAll(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replaceAll(/(CLAUDE_CODE_OAUTH_TOKEN|ANTHROPIC_API_KEY)=\S+/g, '$1=[REDACTED]')
}

function compact(value) {
  return redact(value).replaceAll(/\s+/g, ' ').trim().slice(0, maxInputLength)
}

function parseExecutionLog(path) {
  if (!existsSync(path)) return []

  const raw = readFileSync(path, 'utf8').trim()
  if (!raw) return []

  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)]
      } catch {
        return []
      }
    })
}

function getToolUses(record) {
  const content = record?.message?.content
  if (!Array.isArray(content)) return []
  return content.filter((item) => item?.type === 'tool_use')
}

function summarizeTool(tool) {
  const input = tool.input ?? {}
  const summary =
    input.command ??
    input.description ??
    input.file_path ??
    input.path ??
    input.url ??
    JSON.stringify(input)

  return `${tool.name}: ${compact(summary)}`
}

function poll() {
  const path = candidates.find((candidate) => existsSync(candidate))
  const now = Date.now()

  if (!path) {
    if (now - lastHeartbeat >= heartbeatMs) {
      writeLine(
        `[claude-qa-tail] ${new Date().toISOString()} waiting for Claude execution log at ${candidates.join(', ')}`,
      )
      lastHeartbeat = now
    }
    return
  }

  try {
    const records = parseExecutionLog(path)
    lastKnownPath = path
    lastRecordCount = records.length

    for (const [recordIndex, record] of records.entries()) {
      for (const [toolIndex, tool] of getToolUses(record).entries()) {
        const key = `${recordIndex}:${toolIndex}:${tool.id ?? tool.name}`
        if (seenTools.has(key)) continue

        seenTools.add(key)
        lastToolSummary = summarizeTool(tool)
        writeLine(
          `[claude-qa-tail] ${new Date().toISOString()} tool #${seenTools.size} ${lastToolSummary}`,
        )
      }
    }

    if (now - lastHeartbeat >= heartbeatMs) {
      writeLine(
        `[claude-qa-tail] ${new Date().toISOString()} heartbeat path=${lastKnownPath} records=${lastRecordCount} tools=${seenTools.size} last="${lastToolSummary}"`,
      )
      lastHeartbeat = now
    }
  } catch (error) {
    if (now - lastHeartbeat >= heartbeatMs) {
      writeLine(
        `[claude-qa-tail] ${new Date().toISOString()} could not parse ${path}: ${error.message}`,
      )
      lastHeartbeat = now
    }
  }
}

writeLine(`[claude-qa-tail] ${new Date().toISOString()} starting live Claude execution tailer`)

while (!stopping) {
  poll()
  await new Promise((resolve) => setTimeout(resolve, intervalMs))
}

writeLine(
  `[claude-qa-tail] ${new Date().toISOString()} stopping live Claude execution tailer path=${lastKnownPath || 'none'} records=${lastRecordCount} tools=${seenTools.size}`,
)
