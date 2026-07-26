// The plan's claimed fix: quantity habits are loggable from a compact row,
// where HabitHomeRow used to render a dead spacer instead of a control.
import { launch, seed, shot, readEntries, BASE } from './harness.mjs'
const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { viewMode: 'rows' })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1300)
const today = await page.evaluate(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})
for (const [id, name, target] of [
  ['qa-habit-1', 'Calories Logged', 2200],
  ['qa-habit-2', 'Drink Water', 3],
]) {
  await page.getByRole('button', { name: `Mark ${name} complete` }).click()
  await page.waitForTimeout(600)
  const e = (await readEntries(page, id)).filter((x) => x.date === today)
  console.log(
    `${name}: check control wrote`,
    JSON.stringify(e.map((x) => x.value)),
    'target',
    target,
  )
  const row = page.locator(`[data-testid="habit-today-${name}"]`)
  console.log('  row label now:', JSON.stringify((await row.innerText()).replace(/\n/g, ' | ')))
}
// Also confirm the sheet stepper uses its own scoped id (commit 2b553d6).
await page.getByRole('button', { name: 'Show details for Drink Water' }).click()
await page.waitForTimeout(700)
console.log(
  'input ids on screen:',
  await page.evaluate(() =>
    [...document.querySelectorAll('input[id^=habit-quantity-]')].map((i) => i.id),
  ),
)
await shot(page, '16-rows-quantity-logged')
console.log('errors', errors, consoleErrors)
await browser.close()
