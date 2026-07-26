// Acceptance 4, adversarial names: does ~4 visible characters still tell
// plausible habits apart? These pairs differ within their FIRST WORD after
// char 4, so the plan's stated "Morning …" (whole-first-word) truncation would
// distinguish them.
import { launch, seed, shot, BASE } from './harness.mjs'

const HABITS = [
  { name: 'Stretching', icon: 'habit-stretch', accent: 'rose', kind: { type: 'binary' } },
  { name: 'Strength Training', icon: 'habit-strength', accent: 'amber', kind: { type: 'binary' } },
  { name: 'Meditate', icon: 'habit-meditate', accent: 'cyan', kind: { type: 'binary' } },
  { name: 'Medication', icon: 'habit-supplement', accent: 'purple', kind: { type: 'binary' } },
  { name: 'Journal', icon: 'habit-journal', accent: 'blue', kind: { type: 'binary' } },
  { name: 'Journaling Review', icon: 'habit-read', accent: 'green', kind: { type: 'binary' } },
  { name: 'Walk', icon: 'habit-walk', accent: 'pink', kind: { type: 'binary' } },
]

const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { habits: HABITS, viewMode: 'grid' })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const names = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('[data-testid=habit-tile-grid] article').forEach((a) => {
    const span = a.querySelector('span.truncate')
    const r = span.getBoundingClientRect()
    const cs = getComputedStyle(span)
    const c = document.createElement('canvas').getContext('2d')
    c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const full = span.textContent.trim()
    const ell = c.measureText('…').width
    let visible = full
    if (c.measureText(full).width > r.width) {
      visible = ''
      for (let i = 1; i <= full.length; i += 1) {
        if (c.measureText(full.slice(0, i)).width + ell <= r.width) visible = full.slice(0, i) + '…'
      }
    }
    out.push({ full, visible })
  })
  return out
})
console.log(JSON.stringify(names, null, 1))
const vis = names.map((n) => n.visible)
console.log('distinct:', new Set(vis).size, 'of', vis.length)
await shot(page, '05-grid-truncation-adversarial')
console.log('errors', errors, consoleErrors)
await browser.close()
