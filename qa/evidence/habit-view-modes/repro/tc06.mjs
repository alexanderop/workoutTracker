// Acceptance 6: switching modes is instant and lossless -- no spinner, no
// refetch, no flash of empty state. Cycle grid -> rows -> cards -> grid.
import { launch, seed, shot, BASE } from './harness.mjs'

const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { viewMode: 'grid' })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// Instrument: per-frame habit count + spinner presence, and a counter over
// every IndexedDB read the page makes (a "refetch" would show up here).
await page.evaluate(() => {
  window.__samples = []
  window.__idb = { getAll: 0, get: 0, openCursor: 0 }
  for (const proto of [IDBObjectStore.prototype, IDBIndex.prototype]) {
    for (const fn of ['getAll', 'get', 'openCursor']) {
      if (!proto[fn]) continue
      const original = proto[fn]
      proto[fn] = function (...args) {
        window.__idb[fn] += 1
        return original.apply(this, args)
      }
    }
  }
  window.__net = 0
  const of = window.fetch
  window.fetch = (...a) => {
    window.__net += 1
    return of(...a)
  }
  const tick = () => {
    window.__samples.push({
      t: +performance.now().toFixed(1),
      habits: document.querySelectorAll('[data-testid^="habit-today-"]').length,
      grid: document.querySelectorAll('[data-testid=habit-tile-grid]').length,
      rows: document.querySelectorAll('[data-testid=habit-row-date-header]').length,
      spinners: document.querySelectorAll(
        '[role=progressbar],.animate-spin,[aria-busy=true],[data-loading]',
      ).length,
      emptyState: document.querySelectorAll('[role=status]').length,
    })
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

const cycle = ['rows', 'cards', 'grid']
for (const next of cycle) {
  await page.evaluate(() => {
    window.__mark = window.__samples.length
    window.__idbAtMark = { ...window.__idb }
    window.__netAtMark = window.__net
  })
  const t0 = Date.now()
  await page.locator(`[data-testid=habit-view-mode-${next}]`).click()
  await page.waitForTimeout(700)
  const report = await page.evaluate((next) => {
    const after = window.__samples.slice(window.__mark)
    const key = next === 'cards' ? null : next
    const firstWithLayout = after.findIndex((s) =>
      key === null ? s.grid === 0 && s.rows === 0 && s.habits > 0 : s[key] === 1,
    )
    return {
      framesSampled: after.length,
      minHabitCount: Math.min(...after.map((s) => s.habits)),
      anyZeroHabitFrame: after.some((s) => s.habits === 0),
      anySpinnerFrame: after.some((s) => s.spinners > 0),
      anyEmptyStateFrame: after.some((s) => s.emptyState > 0),
      framesToNewLayout: firstWithLayout,
      msToNewLayout:
        firstWithLayout >= 0 ? +(after[firstWithLayout].t - after[0].t).toFixed(1) : null,
      idbReadsDuringSwitch: {
        getAll: window.__idb.getAll - window.__idbAtMark.getAll,
        get: window.__idb.get - window.__idbAtMark.get,
        openCursor: window.__idb.openCursor - window.__idbAtMark.openCursor,
      },
      fetchesDuringSwitch: window.__net - window.__netAtMark,
    }
  }, next)
  console.log(`-> ${next}`, JSON.stringify(report), `wallclock ${Date.now() - t0}ms`)
  await shot(page, `11-switch-${next}`)
}

console.log('errors', errors, consoleErrors)
await browser.close()
