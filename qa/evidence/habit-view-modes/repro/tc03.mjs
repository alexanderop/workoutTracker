// Acceptance 3: from `grid` and from `rows`, without switching modes --
// tick a binary habit, log a quantity habit to an exact value, retro-toggle a
// past day, edit a habit, archive a habit.
import { launch, seed, shot, readEntries, BASE } from './harness.mjs'

const mode = process.argv[2]
// Without this, a missing argv leaves `mode` undefined: seeding skips the
// setting, the container check silently falls through to the rows selector, and
// the run writes `undefined-a-ticked.png` while still exiting 0 -- evidence that
// looks like a pass and measures nothing.
if (mode !== 'grid' && mode !== 'rows') {
  console.error('usage: node tc03.mjs <grid|rows>')
  process.exit(1)
}
const P = (n) => `${mode}-${n}`

const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { viewMode: mode })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const container =
  mode === 'grid' ? '[data-testid=habit-tile-grid]' : '[data-testid=habit-row-date-header]'
console.log(`[${mode}] layout container present:`, await page.locator(container).count())

const step = async (label, fn) => {
  const before = errors.length + consoleErrors.length
  await fn()
  console.log(
    `[${mode}] ${label}: ok (new errors: ${errors.length + consoleErrors.length - before})`,
  )
}

// --- 1. Tick a binary habit -------------------------------------------------
await step('tick binary (Morning Walk)', async () => {
  await page.getByRole('button', { name: 'Mark Morning Walk complete' }).click()
  await page.waitForTimeout(500)
  const entries = await readEntries(page, 'qa-habit-0')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todays = entries.filter((e) => e.date === today.getTime())
  console.log('   today entry:', JSON.stringify(todays))
  console.log(
    '   control now says:',
    await page
      .getByRole('button', { name: /Morning Walk/ })
      .first()
      .getAttribute('aria-label'),
  )
})
await shot(page, P('a-ticked'))

// --- 2. Log a quantity habit to an exact value ------------------------------
await step('log quantity to exact 1750 kcal (Calories Logged)', async () => {
  await page.getByRole('button', { name: 'Show details for Calories Logged' }).click()
  await page.waitForTimeout(700)
  const input = page.locator('[data-testid=habit-detail-sheet] input')
  console.log('   sheet stepper inputs:', await input.count())
  await input.first().fill('1750')
  await input.first().press('Enter')
  await page.waitForTimeout(700)
  const entries = await readEntries(page, 'qa-habit-1')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  console.log('   today entry:', JSON.stringify(entries.filter((e) => e.date === today.getTime())))
  console.log(
    '   sheet text:',
    JSON.stringify(
      (await page.locator('[data-testid=habit-detail-sheet]').innerText()).slice(0, 80),
    ),
  )
})
await shot(page, P('b-quantity-sheet'))

// --- 3. Retro-toggle a past day (still inside the same sheet) ---------------
await step('retro-toggle a past day', async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = today.getTime() - 3 * 86400000
  const btn = page.locator(`[data-testid="habit-day-${target}"]`)
  console.log('   target day button count:', await btn.count())
  const beforeLabel = await btn.getAttribute('aria-label')
  const beforePressed = await btn.getAttribute('aria-pressed')
  await btn.click()
  await page.waitForTimeout(700)
  const afterPressed = await page
    .locator(`[data-testid="habit-day-${target}"]`)
    .getAttribute('aria-pressed')
  const entries = await readEntries(page, 'qa-habit-1')
  console.log(`   ${beforeLabel}: aria-pressed ${beforePressed} -> ${afterPressed}`)
  console.log('   db row for that day:', JSON.stringify(entries.filter((e) => e.date === target)))
})
await shot(page, P('c-retro-toggle'))

// --- 4. Edit a habit --------------------------------------------------------
await step('edit a habit from the sheet', async () => {
  await page.getByRole('button', { name: /^Edit Calories Logged$/ }).click()
  await page.waitForTimeout(800)
  const nameInput = page.getByLabel('Name', { exact: false }).first()
  console.log('   edit form prefilled with:', await nameInput.inputValue())
  await nameInput.fill('Calories Tracked')
  await page.getByRole('button', { name: /^Save$/ }).click()
  await page.waitForTimeout(900)
  console.log(
    '   renamed root present:',
    await page.locator('[data-testid="habit-today-Calories Tracked"]').count(),
  )
})
await shot(page, P('d-edited'))

// --- 5. Archive a habit -----------------------------------------------------
await step('archive a habit from the sheet', async () => {
  await page.getByRole('button', { name: 'Show details for Stretch' }).click()
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: /^Archive Stretch$/ }).click()
  await page.waitForTimeout(700)
  console.log(
    '   confirm dialog text:',
    JSON.stringify((await page.locator('[role=dialog]').innerText()).slice(0, 140)),
  )
  await page
    .getByRole('button', { name: /Archive$/ })
    .last()
    .click()
  await page.waitForTimeout(900)
  console.log(
    '   Stretch still in list:',
    await page.locator('[data-testid="habit-today-Stretch"]').count(),
  )
  console.log(
    '   remaining habit roots:',
    await page.locator('[data-testid^="habit-today-"]').count(),
  )
  const archived = await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((e) => e.children.length === 0 && /archiv/i.test(e.textContent))
      .map((e) => e.textContent.trim())
      .slice(0, 5),
  )
  console.log('   archived section text:', JSON.stringify(archived))
})
await shot(page, P('e-archived'))

// Still in the mode we started in?
console.log(`[${mode}] layout container still present:`, await page.locator(container).count())
console.log('pageerrors', errors)
console.log('consoleErrors', consoleErrors)
await browser.close()
