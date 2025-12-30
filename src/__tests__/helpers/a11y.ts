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
    for (const violation of results.violations) {
      console.error(`- ${violation.id} (${violation.impact}): ${violation.description}`)
      console.error(`  Help: ${violation.helpUrl}`)
      for (const node of violation.nodes) {
        console.error(`  Element: ${node.html}`)
        if (node.any && node.any.length > 0) {
          for (const check of node.any) {
            console.error(`  Check: ${check.id} - ${check.message}`)
            if (check.data) {
              console.error(`  Data: ${JSON.stringify(check.data)}`)
            }
          }
        }
      }
    }
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
