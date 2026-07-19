const FINAL_VERDICTS = new Set(['HEALTHY', 'MINOR_ISSUES', 'CRITICAL_BUGS', 'QA_SKIPPED'])

import { appendFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export function extractMarkdownSection(body, heading) {
  if (!body) return ''
  const escapedHeading = heading.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
  const regex = new RegExp(
    String.raw`##\s+${escapedHeading}\s*\n([\s\S]*?)(?=\n##\s+|\n#\s+|$)`,
    'i',
  )
  return body.match(regex)?.[1]?.trim() ?? ''
}

export function hasMeaningfulTemplateContent(section) {
  if (!section?.trim()) return false

  const meaningfulLines = section
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*+] |\d+\.\s*)/, '').trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^(?:(?:user can|existing flow still)\s+\.\.\.|(?:affected users|behavior change|changed flow to verify|one adjacent regression path to verify|scenario|given|when|then|forms \/ validation|navigation \/ routing|persistence \/ saved state|mobile layout \/ touch interactions)\s*:\s*(?:\.\.\.|tbd|todo|n\/a)?)$/i.test(
          line,
        ),
    )

  return meaningfulLines.some((line) => {
    const value = line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : line
    return value.length >= 3 && !/^(?:\.\.\.|tbd|todo|pending|n\/a)$/i.test(value)
  })
}

export function validateQaReport(report, structuredOutput = '') {
  if (structuredOutput.trim()) {
    try {
      const data = JSON.parse(structuredOutput)
      if (!FINAL_VERDICTS.has(data.verdict) || data.verdict === 'QA_SKIPPED') {
        return data.verdict === 'QA_SKIPPED'
          ? { ready: true, verdict: data.verdict }
          : { ready: false, reason: 'Structured output has no final verdict' }
      }
      const testsValid =
        Array.isArray(data.tests) &&
        data.tests.length > 0 &&
        data.tests.every(
          (test) =>
            typeof test?.name === 'string' &&
            test.name.trim() &&
            ['pass', 'fail', 'skip'].includes(test.result) &&
            typeof test.details === 'string' &&
            test.details.trim(),
        )
      const metricNames = [
        'total_tests',
        'passed',
        'failed',
        'critical_bugs',
        'major_bugs',
        'minor_bugs',
      ]
      const metricsValid =
        data.metrics &&
        metricNames.every(
          (name) => Number.isSafeInteger(data.metrics[name]) && data.metrics[name] >= 0,
        ) &&
        data.metrics.total_tests === data.tests.length
      if (
        !testsValid ||
        !metricsValid ||
        typeof data.summary !== 'string' ||
        !data.summary.trim()
      ) {
        return { ready: false, reason: 'Structured output has no completed tests or metrics' }
      }
      const markdownResult = validateQaReport(report)
      return markdownResult.ready
        ? { ready: true, verdict: data.verdict }
        : { ready: false, reason: `Markdown report incomplete: ${markdownResult.reason}` }
    } catch {
      return { ready: false, reason: 'Structured output is not valid JSON' }
    }
  }

  if (!report?.trim()) return { ready: false, reason: 'QA report is missing' }
  const verdict = report.match(/(?:\*\*|##\s*)Verdict:(?:\*\*)?\s*([A-Z_]+)/i)?.[1]?.toUpperCase()
  if (!verdict || !FINAL_VERDICTS.has(verdict)) {
    return { ready: false, reason: 'QA report has no final verdict' }
  }
  if (verdict === 'QA_SKIPPED') return { ready: true, verdict }
  if (/\b(?:TBD|Pending|Testing in progress|\(pending\))\b/i.test(report)) {
    return { ready: false, reason: 'QA report still contains unfinished placeholders' }
  }
  const requiredSections = [
    'Acceptance Criteria',
    'Evidence',
    'Bugs / Observations',
    'Accessibility Findings',
    'Console',
    'Confidence',
  ]
  const missing = requiredSections.filter(
    (section) =>
      !new RegExp(String.raw`^##\s+${section.replace('/', String.raw`\/`)}\s*$`, 'im').test(report),
  )
  if (missing.length > 0) {
    return { ready: false, reason: `QA report is missing sections: ${missing.join(', ')}` }
  }
  const empty = requiredSections.filter((section) => {
    const content = extractMarkdownSection(report, section)
    return !content || /^(?:\.\.\.|tbd|todo|pending|n\/a)$/i.test(content.trim())
  })
  return empty.length > 0
    ? { ready: false, reason: `QA report has empty sections: ${empty.join(', ')}` }
    : { ready: true, verdict }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reportPath = process.argv[2] ?? 'qa-report.md'
  const report = await readFile(reportPath, 'utf8').catch(() => '')
  const result = validateQaReport(report, process.env.STRUCTURED_OUTPUT ?? '')
  const lines = [
    `ready=${result.ready}`,
    `verdict=${result.verdict ?? ''}`,
    `reason=${result.reason ?? ''}`,
  ]
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`)
  console.info(
    result.ready ? `QA report ready: ${result.verdict}` : `QA report incomplete: ${result.reason}`,
  )
  if (!result.ready) process.exitCode = 1
}
