/**
 * Re-verification of Acceptance 5 (rows header legibility) and Acceptance 4
 * (tile name width) after the fixes for the two QA findings.
 *
 * TC05b originally showed all seven header labels overflowing their 9.14px
 * columns and painting over each other; TC04b showed the tile name column at
 * 40px (~4 characters). This measures both again on the fixed tree.
 */
import { rmSync } from 'node:fs'
import { launch, seed, EVIDENCE, PROFILE, BASE } from './harness.mjs'

rmSync(PROFILE, { recursive: true, force: true })

const { browser, page, errors, consoleErrors } = await launch()

await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page)
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)

// ---- Acceptance 5: rows header ----
await page.getByTestId('habit-view-mode-rows').click()
await page.waitForTimeout(500)

const header = await page.evaluate(() => {
  const root = document.querySelector('[data-testid="habit-row-date-header"]')
  const cells = [...root.querySelectorAll('.grid-cols-7 > *')]
  return cells.map((cell) => ({
    text: cell.textContent.trim(),
    column: Math.round(cell.clientWidth * 100) / 100,
    needs: Math.round(cell.scrollWidth * 100) / 100,
    isToday: cell.dataset.today === 'true',
  }))
})

// Do neighbouring labels visually collide?
const collisions = await page.evaluate(() => {
  const root = document.querySelector('[data-testid="habit-row-date-header"]')
  const cells = [...root.querySelectorAll('.grid-cols-7 > *')]
  const boxes = cells.map((c) => c.getBoundingClientRect())
  let hits = 0
  for (let i = 1; i < boxes.length; i += 1) {
    if (boxes[i].left < boxes[i - 1].right - 0.5) hits += 1
  }
  return hits
})

await page.screenshot({ path: `${EVIDENCE}/30-rows-header-fixed.png` })

// ---- Acceptance 4: tile names ----
await page.getByTestId('habit-view-mode-grid').click()
await page.waitForTimeout(500)

const tiles = await page.evaluate(() => {
  const names = [...document.querySelectorAll('[data-testid="habit-tile-name"]')]
  return names.map((n) => ({
    full: n.textContent.trim(),
    width: Math.round(n.getBoundingClientRect().width * 100) / 100,
    truncated: n.scrollWidth > n.clientWidth,
  }))
})

const main = await page.evaluate(() => {
  const m = document.querySelector('main')
  return { scrollHeight: m.scrollHeight, clientHeight: m.clientHeight }
})

await page.screenshot({ path: `${EVIDENCE}/31-grid-names-fixed.png` })

console.info('=== Acceptance 5: rows date header ===')
for (const cell of header) {
  const fits = cell.needs <= cell.column ? 'fits' : 'OVERFLOWS'
  console.info(
    `  ${cell.isToday ? '*' : ' '} ${JSON.stringify(cell.text).padEnd(8)} column=${cell.column}px needs=${cell.needs}px ${fits}`,
  )
}
console.info(`  overflowing: ${header.filter((c) => c.needs > c.column).length}/7`)
console.info(`  neighbour collisions: ${collisions}`)
console.info(`  columns marked today: ${header.filter((c) => c.isToday).length}`)

console.info('=== Acceptance 4: tile names ===')
for (const tile of tiles) {
  console.info(
    `  ${tile.full.padEnd(20)} width=${tile.width}px ${tile.truncated ? '(truncated)' : ''}`,
  )
}
console.info(`  narrowest: ${Math.min(...tiles.map((t) => t.width))}px`)
console.info(
  `  grid scrolls at 7 habits: ${main.scrollHeight > main.clientHeight} (${main.scrollHeight} vs ${main.clientHeight})`,
)

console.info('=== errors ===')
console.info(`  pageerrors: ${errors.length} ${errors.join(' | ')}`)
console.info(`  console errors: ${consoleErrors.length} ${consoleErrors.join(' | ')}`)

await browser.close()
