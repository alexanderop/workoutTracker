// Acceptance 5: rows mode -- header aligns column-for-column with the heatmap
// cells beneath it, and today's column is distinct at a glance.
import { launch, seed, shot, BASE } from './harness.mjs'

const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { viewMode: 'rows' })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

console.log('header present:', await page.locator('[data-testid=habit-row-date-header]').count())
console.log(
  'header text:',
  JSON.stringify(await page.locator('[data-testid=habit-row-date-header]').innerText()),
)
console.log('today is:', await page.evaluate(() => new Date().toDateString()))

const align = await page.evaluate(() => {
  const header = document.querySelector('[data-testid=habit-row-date-header]')
  const headerCells = [...header.querySelectorAll('.grid-cols-7 > span')].map((s) => {
    const r = s.getBoundingClientRect()
    return {
      text: s.innerText.replaceAll('\n', ' '),
      cx: +(r.x + r.width / 2).toFixed(1),
      bold: getComputedStyle(s).fontWeight,
      color: getComputedStyle(s).color,
    }
  })
  const rows = [...document.querySelectorAll('[data-testid^="habit-today-"]')].map((row) => {
    const name = row.getAttribute('data-testid').replace('habit-today-', '')
    const cells = [...row.querySelectorAll('[role=img] > span')].map((s) => {
      const r = s.getBoundingClientRect()
      return {
        cx: +(r.x + r.width / 2).toFixed(1),
        w: +r.width.toFixed(1),
        ring: s.className.includes('habit-today-ring'),
        outline: getComputedStyle(s).outline,
        boxShadow: getComputedStyle(s).boxShadow,
      }
    })
    return { name, count: cells.length, cells }
  })
  return { headerCells, rows }
})

console.log('header cells:', JSON.stringify(align.headerCells, null, 1))
console.log('first row cells:', JSON.stringify(align.rows[0], null, 1))
console.log(
  'cell counts:',
  align.rows.map((r) => r.count),
)

// Column-for-column: header centre vs every row's cell centre.
const drift = align.rows.flatMap((r) =>
  r.cells.map((c, i) => Math.abs(c.cx - align.headerCells[i].cx)),
)
console.log('max header/cell centre drift (px):', Math.max(...drift).toFixed(2))

// Which column is ringed as today, and does the header mark the same one?
const ringIdx = align.rows[0].cells.findIndex((c) => c.ring)
const boldIdx = align.headerCells.findIndex((h) => Number(h.bold) >= 700)
console.log('ringed cell index:', ringIdx, 'bold header index:', boldIdx)

await shot(page, '06-rows-mode')
await page.locator('[data-testid=habit-row-date-header]').screenshot({
  path: '/home/user/workoutTracker/qa/evidence/habit-view-modes/07-rows-header-crop.png',
})
// A tight crop over the header + first two rows makes the alignment checkable.
await page.evaluate(() => {
  const el = document.querySelector('[data-testid=habit-row-date-header]')
  const r = el.getBoundingClientRect()
  window.__crop = { x: r.x, y: r.y }
})
const crop = await page.evaluate(() => window.__crop)
await page.screenshot({
  path: '/home/user/workoutTracker/qa/evidence/habit-view-modes/08-rows-header-alignment.png',
  clip: { x: crop.x - 4, y: crop.y - 6, width: 374, height: 180 },
})

console.log('errors', errors, consoleErrors)
await browser.close()
