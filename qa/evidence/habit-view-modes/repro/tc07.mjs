// Acceptance 1 regression detail + toggle robustness + home-card non-regression.
import { launch, seed, shot, readEntries, readSetting, BASE } from './harness.mjs'

const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page) // no stored mode at all
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)

// --- cards mode still logs, inline, as before -------------------------------
console.log('stored mode (untouched profile):', await readSetting(page, 'habitViewMode'))
const card = page.locator('[data-testid="habit-today-Morning Walk"]')
console.log('card shows streak without tapping:', JSON.stringify(await card.innerText()))
console.log('card heatmap window:', await card.locator('[role=img]').getAttribute('aria-label'))
await page.getByRole('button', { name: 'Mark Morning Walk complete' }).click()
await page.waitForTimeout(500)
console.log('binary logged in cards:', (await readEntries(page, 'qa-habit-0')).length)

// Inline quantity stepper on the card (cards keeps it per the plan)
const cardInput = page.locator('#habit-quantity-card-qa-habit-1')
console.log('inline card stepper present:', await cardInput.count())
await cardInput.fill('900')
await cardInput.press('Enter')
await page.waitForTimeout(600)
const today = await page.evaluate(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})
console.log(
  'inline quantity write:',
  JSON.stringify((await readEntries(page, 'qa-habit-1')).filter((e) => e.date === today)),
)

// Card body no longer expands inline -- it opens the sheet.
await page.getByRole('button', { name: 'Show details for Morning Walk' }).click()
await page.waitForTimeout(700)
console.log(
  'sheet opened from card:',
  await page.locator('[data-testid=habit-detail-sheet]').count(),
)
console.log(
  'two steppers coexist w/ distinct ids:',
  await page.evaluate(() =>
    [...document.querySelectorAll('input[id^=habit-quantity-]')].map((i) => i.id),
  ),
)
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

// --- toggle robustness ------------------------------------------------------
const labels = await page.evaluate(() =>
  [...document.querySelectorAll('[data-testid=habit-view-mode-toggle] button')].map((b) => ({
    label: b.getAttribute('aria-label'),
    state: b.getAttribute('data-state'),
    w: Math.round(b.getBoundingClientRect().width),
    h: Math.round(b.getBoundingClientRect().height),
  })),
)
console.log('toggle items:', JSON.stringify(labels))
console.log(
  'toggle group label:',
  await page.locator('[data-testid=habit-view-mode-toggle]').getAttribute('aria-label'),
)

// Tapping the already-active mode must be a no-op, never "no layout".
await page.locator('[data-testid=habit-view-mode-cards]').click()
await page.waitForTimeout(600)
console.log(
  'after re-tapping active mode, habit roots:',
  await page.locator('[data-testid^="habit-today-"]').count(),
)
console.log('stored mode still:', await readSetting(page, 'habitViewMode'))

// Keyboard reach
await page.locator('[data-testid=habit-view-mode-cards]').focus()
await page.keyboard.press('ArrowLeft')
await page.keyboard.press('Enter')
await page.waitForTimeout(600)
console.log(
  'after keyboard select, rows present:',
  await page.locator('[data-testid=habit-row-date-header]').count(),
)
console.log('stored after keyboard:', await readSetting(page, 'habitViewMode'))

// --- home card must be unaffected (no date header) --------------------------
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
console.log(
  'home date header present (expect 0):',
  await page.locator('[data-testid=habit-row-date-header]').count(),
)
console.log('home habit rows:', await page.locator('[data-testid^="habit-today-"]').count())
await shot(page, '12-home-card-unchanged')

// --- empty profile: no toggle, empty state intact ---------------------------
await seed(page, { habits: [], entries: false })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
console.log(
  'empty profile toggle present (expect 0):',
  await page.locator('[data-testid=habit-view-mode-toggle]').count(),
)
console.log(
  'empty state text:',
  JSON.stringify((await page.locator('.border-dashed').innerText()).slice(0, 90)),
)
await shot(page, '13-empty-state')

console.log('errors', errors, consoleErrors)
await browser.close()
