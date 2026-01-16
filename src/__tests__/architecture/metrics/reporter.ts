/**
 * Metrics Reporter
 *
 * Formats Main Sequence metrics for console output and test failure messages.
 */

import { ZONE_THRESHOLDS } from './moduleDefinitions'
import type { MetricsReport } from './types'

/**
 * Format a number to a fixed number of decimal places
 */
function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}

/**
 * Get a status indicator based on pass/fail
 */
function getStatusIndicator(passes: boolean): string {
  return passes ? 'PASS' : 'FAIL'
}

/**
 * Get zone label based on distance
 */
function getZoneLabel(distance: number): string {
  if (distance < ZONE_THRESHOLDS.ideal) return 'Ideal'
  if (distance < ZONE_THRESHOLDS.acceptable) return 'Good'
  if (distance < ZONE_THRESHOLDS.warning) return 'Warning'
  return 'Danger'
}

/**
 * Format metrics as a markdown table
 */
export function formatMetricsTable(report: MetricsReport): string {
  const header = ['| Module | A | I | D | Max | Zone | Status |', '|--------|------|------|------|------|----------|--------|']

  // Sort by distance (worst first)
  const sortedModules = [...report.modules].toSorted((a, b) => b.distance - a.distance)

  const rows = sortedModules.map((m) => {
    const A = fmt(m.abstractness.abstractness)
    const I = fmt(m.instability.instability)
    const D = fmt(m.distance, 3)
    const maxD = fmt(m.module.maxDistance)
    const zone = getZoneLabel(m.distance)
    const status = getStatusIndicator(m.passes)
    return `| ${m.module.name} | ${A} | ${I} | ${D} | ${maxD} | ${zone} | ${status} |`
  })

  return [...header, ...rows].join('\n')
}

/**
 * Format summary statistics
 */
export function formatSummary(report: MetricsReport): string {
  const { summary } = report

  return [
    'Main Sequence Metrics Summary',
    '=============================',
    `Total modules: ${summary.totalModules}`,
    `Passing: ${summary.passingModules}`,
    `Failing: ${summary.failingModules}`,
    `Average distance: ${fmt(summary.averageDistance, 3)}`,
    `Max distance: ${fmt(summary.maxDistance, 3)} (${summary.worstModule})`,
  ].join('\n')
}

/**
 * Format violations for test failure message
 */
export function formatViolations(report: MetricsReport): string {
  if (report.violations.length === 0) {
    return 'All modules within thresholds.'
  }

  const violationLines = report.violations.flatMap((v) => [
    `${v.module}:`,
    `  ${v.message}`,
    `  Suggestion: ${v.suggestion}`,
    '',
  ])

  return ['Main Sequence Violations:', '', ...violationLines].join('\n')
}

/**
 * Create a 2D grid for ASCII plot
 */
function createGrid(width: number, height: number): Array<Array<string>> {
  return Array.from({ length: height + 1 }, () =>
    Array.from({ length: width + 1 }, () => ' '),
  )
}

/**
 * Safely set a grid cell value
 */
function setGridCell(
  grid: Array<Array<string>>,
  y: number,
  x: number,
  value: string,
): void {
  const row = grid[y]
  if (row) {
    row[x] = value
  }
}

/**
 * Safely get a grid row as string
 */
function getGridRow(grid: Array<Array<string>>, y: number): string {
  const row = grid[y]
  return row ? row.join('') : ''
}

/**
 * Draw axes on the grid
 */
function drawAxes(grid: Array<Array<string>>, width: number, height: number): void {
  // Draw horizontal axis
  for (let x = 0; x <= width; x++) {
    setGridCell(grid, height, x, '-')
  }

  // Draw vertical axis
  for (let y = 0; y <= height; y++) {
    setGridCell(grid, y, 0, '|')
  }

  // Origin
  setGridCell(grid, height, 0, '+')
}

/**
 * Draw the Main Sequence diagonal line
 */
function drawMainSequence(grid: Array<Array<string>>, width: number, height: number): void {
  for (let x = 0; x <= width; x++) {
    const I = x / width
    const A = 1 - I
    const y = height - Math.round(A * height)

    if (y >= 0 && y <= height) {
      setGridCell(grid, y, x, '.')
    }
  }
}

/**
 * Plot modules on the grid
 */
function plotModules(
  grid: Array<Array<string>>,
  modules: MetricsReport['modules'],
  width: number,
  height: number,
): void {
  for (const m of modules) {
    const I = m.instability.instability
    const A = m.abstractness.abstractness

    const x = Math.round(I * width)
    const y = height - Math.round(A * height)

    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      setGridCell(grid, y, x, m.passes ? '*' : 'X')
    }
  }
}

/**
 * Build the output lines from the grid
 */
function buildPlotOutput(grid: Array<Array<string>>, width: number, height: number): string {
  const lines = ['A', '1.0 ' + getGridRow(grid, 0)]

  for (let y = 1; y < height; y++) {
    const label = y === Math.round(height / 2) ? '0.5 ' : '    '
    lines.push(label + getGridRow(grid, y))
  }

  lines.push(
    '0.0 ' + getGridRow(grid, height),
    '    0.0' + ' '.repeat(width / 2 - 4) + '0.5' + ' '.repeat(width / 2 - 2) + '1.0  I',
    '',
    'Legend: . = Main Sequence, * = Passing module, X = Failing module',
  )

  return lines.join('\n')
}

/**
 * Generate a simple ASCII visualization of the Main Sequence plot
 * X-axis: Instability (0-1)
 * Y-axis: Abstractness (0-1)
 * Diagonal line: Main Sequence (A + I = 1)
 */
export function generateAsciiPlot(report: MetricsReport): string {
  const width = 40
  const height = 20
  const grid = createGrid(width, height)

  drawAxes(grid, width, height)
  drawMainSequence(grid, width, height)
  plotModules(grid, report.modules, width, height)

  return buildPlotOutput(grid, width, height)
}
