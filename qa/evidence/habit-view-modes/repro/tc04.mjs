// Acceptance 4: grid fits 7 habits without scrolling; distinct tap targets;
// truncated names still tell the habits apart.
import { launch, seed, shot, BASE } from './harness.mjs'

const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { viewMode: 'grid' })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const scroll = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  clientHeight: document.documentElement.clientHeight,
  bodyScroll: document.body.scrollHeight,
}))
console.log('scroll', scroll)

// Where does the grid end vs. where does the sticky nav start?
const gridBox = await page.locator('[data-testid=habit-tile-grid]').boundingBox()
const nav = await page.locator('nav').first().boundingBox()
console.log('grid box', gridBox, 'nav box', nav)

// Every check control: size and position.
const checks = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('[data-testid=habit-tile-grid] button[aria-pressed]').forEach((b) => {
    const r = b.getBoundingClientRect()
    out.push({
      label: b.getAttribute('aria-label'),
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    })
  })
  return out
})
console.log('checks', JSON.stringify(checks, null, 1))

// Visible (post-truncation) name strings.
const names = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('[data-testid=habit-tile-grid] article').forEach((a) => {
    const span = a.querySelector('span.truncate')
    const r = span.getBoundingClientRect()
    // Binary-search the longest prefix that still fits the rendered width.
    const cs = getComputedStyle(span)
    const canvas = document.createElement('canvas').getContext('2d')
    canvas.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const full = span.textContent.trim()
    let visible = ''
    const ell = canvas.measureText('…').width
    for (let i = 1; i <= full.length; i += 1) {
      if (canvas.measureText(full.slice(0, i)).width + ell <= r.width) visible = full.slice(0, i)
    }
    out.push({
      full,
      widthPx: Math.round(r.width),
      truncated: canvas.measureText(full).width > r.width,
      visiblePrefix: visible,
    })
  })
  return out
})
console.log('names', JSON.stringify(names, null, 1))
const prefixes = names.map((n) => (n.truncated ? n.visiblePrefix : n.full))
console.log('distinct visible strings:', new Set(prefixes).size, 'of', prefixes.length)

await shot(page, '04-grid-7-habits')
console.log('errors', errors, consoleErrors)
await browser.close()
