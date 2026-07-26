// Acceptance 1 (details now open in a sheet) + Acceptance 2 (mode survives a
// cold start: a real browser-process restart against a persistent profile).
import { launch, seed, shot, readSetting, BASE } from './harness.mjs'
import { rmSync } from 'node:fs'
import { PROFILE } from './harness.mjs'

rmSync(PROFILE, { recursive: true, force: true })

// --- Session 1: seed, confirm default, open the sheet, then pick grid --------
{
  const { browser, page, errors, consoleErrors } = await launch()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await seed(page)
  await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  console.log('S1 stored habitViewMode (never chosen):', await readSetting(page, 'habitViewMode'))
  console.log(
    'S1 default layout is cards:',
    (await page.locator('[data-testid=habit-tile-grid]').count()) === 0 &&
      (await page.locator('[data-testid=habit-row-date-header]').count()) === 0,
  )

  // Acceptance 1: details open in a sheet, not an inline expand.
  await page.getByRole('button', { name: 'Show details for Morning Walk' }).click()
  await page.waitForTimeout(600)
  console.log('S1 sheet open:', await page.locator('[data-testid=habit-detail-sheet]').count())
  console.log(
    'S1 sheet text:',
    JSON.stringify(
      (await page.locator('[data-testid=habit-detail-sheet]').innerText()).slice(0, 200),
    ),
  )
  await shot(page, '02-cards-detail-sheet')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Pick grid.
  await page.locator('[data-testid=habit-view-mode-grid]').click()
  await page.waitForTimeout(800)
  console.log('S1 grid rendered:', await page.locator('[data-testid=habit-tile-grid]').count())
  console.log('S1 stored after picking grid:', await readSetting(page, 'habitViewMode'))
  console.log('S1 errors', errors, consoleErrors)
  await browser.close()
}

// --- Session 2: brand new browser process, same profile ---------------------
{
  const { browser, page, errors, consoleErrors } = await launch()
  await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  console.log('S2 (cold start) stored:', await readSetting(page, 'habitViewMode'))
  console.log('S2 tile-grid present:', await page.locator('[data-testid=habit-tile-grid]').count())
  console.log('S2 habit roots:', await page.locator('[data-testid^="habit-today-"]').count())
  const pressed = await page
    .locator('[data-testid=habit-view-mode-grid]')
    .getAttribute('data-state')
  console.log('S2 grid toggle data-state:', pressed)
  await shot(page, '03-cold-start-grid')
  console.log('S2 errors', errors, consoleErrors)
  await browser.close()
}
