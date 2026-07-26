// Acceptance 5, follow-up: is the weekday row legible, and does today stay
// distinct mid-week (not just when it is the last column)?
import { launch, seed, shot, BASE } from './harness.mjs'

const { browser, context, page, errors, consoleErrors } = await launch()

// Pin "now" to a Wednesday so today is an interior column.
await context.clock.install({ time: new Date('2026-07-22T10:30:00') })

await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { viewMode: 'rows' })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1500)

console.log('page now:', await page.evaluate(() => new Date().toString()))
console.log(
  'header text:',
  JSON.stringify(await page.locator('[data-testid=habit-row-date-header]').innerText()),
)

const overflow = await page.evaluate(() => {
  const header = document.querySelector('[data-testid=habit-row-date-header]')
  const track = header.querySelector('.grid-cols-7')
  return [...track.children].map((cell) => {
    const r = cell.getBoundingClientRect()
    const wd = cell.children[0]
    const dm = cell.children[1]
    return {
      text: cell.innerText.replace('\n', '/'),
      cellW: +r.width.toFixed(2),
      weekdayTextW: +wd.getBoundingClientRect().width.toFixed(2),
      weekdayScrollW: wd.scrollWidth,
      dayScrollW: dm.scrollWidth,
      fontWeight: getComputedStyle(cell).fontWeight,
    }
  })
})
console.log('header cells vs text:', JSON.stringify(overflow, null, 1))
console.log(
  'weekday labels wider than their column:',
  overflow.filter((c) => c.weekdayScrollW > c.cellW + 0.5).map((c) => c.text),
)

const ringInfo = await page.evaluate(() => {
  const row = document.querySelector('[data-testid^="habit-today-"]')
  const cells = [...row.querySelectorAll('[role=img] > span')]
  return {
    ringIdx: cells.findIndex((c) => c.className.includes('habit-today-ring')),
    states: cells.map((c) =>
      c.className.includes('habit-grid-complete')
        ? 'complete'
        : c.className.includes('habit-grid-partial')
          ? 'partial'
          : c.className.includes('bg-transparent')
            ? 'future'
            : 'empty',
    ),
  }
})
console.log('midweek ring/states:', JSON.stringify(ringInfo))

await shot(page, '09-rows-midweek')
const crop = await page.evaluate(() => {
  const r = document.querySelector('[data-testid=habit-row-date-header]').getBoundingClientRect()
  return { x: r.x, y: r.y }
})
await page.screenshot({
  path: '/home/user/workoutTracker/qa/evidence/habit-view-modes/10-rows-header-midweek-crop.png',
  clip: { x: crop.x - 4, y: crop.y - 8, width: 374, height: 170 },
})
console.log('errors', errors, consoleErrors)
await browser.close()
