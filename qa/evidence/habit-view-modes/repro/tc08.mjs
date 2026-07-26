// Follow-up: the app shell's floating quick-add pill appears to draw over the
// new HabitDetailSheet's Edit/Archive row. Is it this feature's sheet, or every
// bottom sheet in the shell?
import { launch, seed, shot, BASE } from './harness.mjs'

const { browser, page, errors, consoleErrors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await seed(page, { viewMode: 'grid' })
await page.goto(`${BASE}/habits`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)

const geom = async (label) => {
  const r = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return {
        x: Math.round(b.x),
        y: Math.round(b.y),
        w: Math.round(b.width),
        h: Math.round(b.height),
        z: getComputedStyle(el).zIndex,
      }
    }
    // The shell's floating quick-add control: fixed, bottom-anchored, in <nav>.
    const navFixed = [...document.querySelectorAll('body *')].filter((e) => {
      const s = getComputedStyle(e)
      return s.position === 'fixed' && s.zIndex !== 'auto' && Number(s.zIndex) >= 40
    })
    const sheet = document.querySelector('[data-testid=habit-detail-sheet]')
    const buttons = sheet
      ? [...sheet.querySelectorAll('button')].map((b) => ({
          name: b.getAttribute('aria-label') || b.innerText.trim(),
          ...box(b),
        }))
      : []
    return {
      fixedLayers: navFixed.map((e) => ({
        tag: e.tagName,
        cls: e.className.toString().slice(0, 70),
        ...box(e),
      })),
      sheetButtons: buttons,
    }
  })
  console.log(label, JSON.stringify(r, null, 1))
  return r
}

// A binary habit -> the shortest sheet -> its action row sits lowest.
await page.getByRole('button', { name: 'Show details for Morning Walk' }).click()
await page.waitForTimeout(900)
const g = await geom('SHEET (binary habit):')
await shot(page, '14-sheet-binary-overlap')

// Is the Edit button actually reachable, or is it covered?
const hit = await page.evaluate(() => {
  const sheet = document.querySelector('[data-testid=habit-detail-sheet]')
  const edit = [...sheet.querySelectorAll('button')].find((b) =>
    /Edit/.test(b.getAttribute('aria-label') || ''),
  )
  const archive = [...sheet.querySelectorAll('button')].find((b) =>
    /Archive/.test(b.getAttribute('aria-label') || ''),
  )
  const probe = (el) => {
    const r = el.getBoundingClientRect()
    const pts = {
      centre: [r.x + r.width / 2, r.y + r.height / 2],
      left: [r.x + 4, r.y + r.height / 2],
      bottomLeft: [r.x + 4, r.y + r.height - 2],
    }
    const out = {}
    for (const [k, [x, y]] of Object.entries(pts)) {
      const top = document.elementFromPoint(x, y)
      out[k] = {
        hits: el.contains(top) || top === el,
        topTag: top?.tagName,
        topCls: top?.className?.toString().slice(0, 50),
      }
    }
    return out
  }
  return { edit: probe(edit), archive: probe(archive) }
})
console.log('hit-test on sheet actions:', JSON.stringify(hit, null, 1))

await page.keyboard.press('Escape')
await page.waitForTimeout(600)

// Comparison: an existing bottom sheet elsewhere in the shell (quick add).
await page.locator('nav button[aria-label="Quick add"]').click()
await page.waitForTimeout(900)
const qa = await page.evaluate(() => {
  const sheets = [...document.querySelectorAll('[role=dialog]')]
  return sheets.map((s) => {
    const r = s.getBoundingClientRect()
    return {
      z: getComputedStyle(s).zIndex,
      y: Math.round(r.y),
      h: Math.round(r.height),
      text: s.innerText.slice(0, 60).replace(/\n/g, ' | '),
    }
  })
})
console.log('quick-add sheet:', JSON.stringify(qa))
await shot(page, '15-quickadd-sheet-comparison')

console.log('errors', errors, consoleErrors)
await browser.close()
