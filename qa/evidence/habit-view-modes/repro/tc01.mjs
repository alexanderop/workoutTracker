import { launch, seed, shot, BASE } from './harness.mjs'

const { browser, page, errors, consoleErrors } = await launch()

// First load creates the Dexie DB, then we seed and reload into a real profile.
await page.goto(BASE, { waitUntil: 'networkidle' })
const seeded = await seed(page)
console.log('seeded', seeded)

await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
console.log('url', page.url())
console.log('title h1', await page.locator('h1').first().innerText())

// What layout is rendering by default?
console.log('tile-grid present', await page.locator('[data-testid=habit-tile-grid]').count())
console.log('row-header present', await page.locator('[data-testid=habit-row-date-header]').count())
const cards = await page.locator('[data-testid^="habit-today-"]').count()
console.log('habit roots', cards)
console.log('toggle present', await page.locator('[data-testid=habit-view-mode-toggle]').count())

// Card mode signals: heatmap, streak, check control, all without tapping.
const first = page.locator('[data-testid="habit-today-Morning Walk"]')
console.log('first card html length', (await first.innerHTML()).length)
console.log('first card text', JSON.stringify(await first.innerText()))
console.log('grid img label', await first.locator('[role=img]').first().getAttribute('aria-label'))
console.log('check aria', await first.getByRole('button', { name: /Mark Morning Walk/ }).count())

await shot(page, '01-cards-default')
await page.evaluate(() => window.scrollTo(0, 100000))
await shot(page, '01b-cards-default-scrolled')

console.log('pageerrors', errors)
console.log('consoleErrors', consoleErrors)
await browser.close()
