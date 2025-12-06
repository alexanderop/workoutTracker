import axe from 'axe-core'
import { expect } from 'vitest'

type AxeResults = Awaited<ReturnType<typeof axe.run>>

/**
 * Asserts that a container has no accessibility violations.
 * Logs detailed violation information if any issues are found.
 */
export async function assertNoViolations(container: Element): Promise<void> {
  const results = await axe.run(container)

  if (results.violations.length > 0) {
    console.error('Accessibility violations found:')
    results.violations.forEach((violation) => {
      console.error(`- ${violation.id} (${violation.impact}): ${violation.description}`)
      console.error(`  Help: ${violation.helpUrl}`)
      violation.nodes.forEach((node) => {
        console.error(`  Element: ${node.html}`)
      })
    })
  }

  expect(results.violations).toHaveLength(0)
}

/**
 * Runs axe with WCAG 2.1 AA rules only.
 * Use for stricter compliance checking.
 */
export async function checkWcagAA(container: Element): Promise<AxeResults> {
  return axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  })
}

/**
 * Runs axe excluding color contrast rules.
 * Use when color contrast causes false positives or is handled separately.
 */
export async function assertNoViolationsWithoutContrast(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(results.violations).toHaveLength(0)
}
