#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'

const logPath = process.argv[2]
const maxInputLength = Number(process.env.CLAUDE_SUMMARY_MAX_INPUT_LENGTH ?? '300')

function redact(value) {
  return String(value)
    .replaceAll(/gh[pousr]_[A-Za-z0-9_]{20,}/g, '[REDACTED_GITHUB_TOKEN]')
    .replaceAll(/github_pat_[A-Za-z0-9_]+/g, '[REDACTED_GITHUB_TOKEN]')
    .replaceAll(/sk-ant-[A-Za-z0-9_-]+/g, '[REDACTED_ANTHROPIC_KEY]')
    .replaceAll(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replaceAll(/(CLAUDE_CODE_OAUTH_TOKEN|ANTHROPIC_API_KEY)=\S+/g, '$1=[REDACTED]')
}

function compact(value, limit = maxInputLength) {
  return redact(value).replaceAll(/\s+/g, ' ').trim().slice(0, limit)
}

function parseExecutionLog(path) {
  if (!existsSync(path)) return []

  const raw = readFileSync(path, 'utf8').trim()
  if (!raw) return []

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
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

function summarizeTool(tool, limit) {
  const input = tool.input ?? {}
  const summary =
    input.command ??
    input.description ??
    input.file_path ??
    input.path ??
    input.url ??
    JSON.stringify(input)

  return `**${tool.name}**: ${compact(summary, limit)}`
}

function countByName(tools) {
  const counts = new Map()
  for (const tool of tools) {
    counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1)
  }
  return [...counts]
    .toSorted((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}: ${count}`)
    .join(', ')
}

function getResultValue(result, keys, fallback = 'n/a') {
  for (const keyPath of keys) {
    const value = keyPath.split('.').reduce((current, key) => current?.[key], result)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}

function renderSummary(records, lineCount) {
  const assistantTurns = records.filter((record) => record?.type === 'assistant').length
  const userMessages = records.filter((record) => record?.type === 'user').length
  const tools = records.flatMap(getToolUses)
  const result = records.findLast((record) => record?.type === 'result') ?? {}
  const errors = Array.isArray(result.errors) ? result.errors : []
  const modelUsage = result.modelUsage ? Object.keys(result.modelUsage).join(', ') : 'n/a'

  const cost = getResultValue(result, ['total_cost_usd', 'usage.costUSD', 'result.usage.costUSD'])
  const duration = getResultValue(result, ['duration_ms', 'durationMs', 'result.durationMs'])
  const terminal = getResultValue(result, ['terminal_reason', 'subtype', 'stop_reason'], 'unknown')
  const sessionId = getResultValue(result, ['session_id'], 'n/a')

  const lastTools = tools
    .slice(-8)
    .map((tool) => `- ${summarizeTool(tool, 220)}`)
    .join('\n')
  const allTools = tools
    .map((tool, index) => `${index + 1}. ${summarizeTool(tool, 320)}`)
    .join('\n')

  return `## Claude execution summary

| Metric | Value |
|---|---|
| Assistant turns | ${assistantTurns} |
| Tool result messages | ${userMessages} |
| Stream lines | ${lineCount} |
| Parsed records | ${records.length} |
| Tool calls | ${tools.length} |
| Cost (USD) | ${cost} |
| Duration (ms) | ${duration} |
| Terminal reason | ${terminal} |
| Session ID | ${sessionId} |
| Models | ${modelUsage} |

**Tool usage:** ${countByName(tools) || 'none captured'}

${errors.length > 0 ? `**Errors:** ${errors.map((error) => compact(error, 180)).join('; ')}\n` : ''}
### Last tool calls before exit

${lastTools || '_No tool_use blocks captured._'}

<details><summary>Full tool call sequence (${tools.length} calls)</summary>

${allTools || '_No tool_use blocks captured._'}

</details>
`
}

if (!logPath || !existsSync(logPath)) {
  console.info(`## Claude execution summary

_No \`claude-execution-output.json\` found — the action likely exited before Claude started (for example, input validation or authentication setup failed)._
`)
  process.exit(0)
}

const raw = readFileSync(logPath, 'utf8')
const records = parseExecutionLog(logPath)
console.info(renderSummary(records, raw.split(/\r?\n/).filter(Boolean).length))
