import { chromium } from '/home/user/workoutTracker/node_modules/playwright/index.mjs'
import { mkdirSync } from 'node:fs'

export const BASE = 'http://localhost:5173'
export const EVIDENCE = '/home/user/workoutTracker/qa/evidence/habit-view-modes'
mkdirSync(EVIDENCE, { recursive: true })

export const HABITS = [
  { name: 'Morning Walk', icon: 'habit-walk', accent: 'green', kind: { type: 'binary' } },
  {
    name: 'Calories Logged',
    icon: 'habit-nutrition',
    accent: 'amber',
    kind: { type: 'quantity', target: 2200, unit: 'kcal' },
  },
  {
    name: 'Drink Water',
    icon: 'habit-water',
    accent: 'blue',
    kind: { type: 'quantity', target: 3, unit: 'L' },
  },
  { name: 'Read 20 Pages', icon: 'habit-read', accent: 'purple', kind: { type: 'binary' } },
  { name: 'Meditate', icon: 'habit-meditate', accent: 'cyan', kind: { type: 'binary' } },
  { name: 'Stretch', icon: 'habit-stretch', accent: 'rose', kind: { type: 'binary' } },
  { name: 'No Phone After 9', icon: 'habit-no-phone', accent: 'pink', kind: { type: 'binary' } },
]

export const PROFILE =
  '/tmp/claude-0/-home-user-workoutTracker/495d3a2f-3b39-5fbf-be89-c6ed78165d2f/scratchpad/profile'

/**
 * A *persistent* context, so closing the browser and relaunching is a real
 * cold start with IndexedDB intact -- which is what Acceptance 2 asks for.
 */
export async function launch() {
  const context = await chromium.launchPersistentContext(PROFILE, {
    executablePath: '/opt/pw-browsers/chromium-1228/chrome-linux64/chrome',
    args: ['--no-sandbox', '--font-render-hinting=none'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const browser = { close: () => context.close() }
  const page = context.pages()[0] ?? (await context.newPage())
  const errors = []
  const consoleErrors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('requestfailed', (r) =>
    consoleErrors.push(`REQFAIL ${r.url()} ${r.failure()?.errorText}`),
  )
  return { browser, context, page, errors, consoleErrors }
}

/** Write habits + onboarding + entries straight into the app's IndexedDB. */
export async function seed(page, { habits = HABITS, entries = true, viewMode = null } = {}) {
  return page.evaluate(
    async ({ habits, entries, viewMode }) => {
      const open = () =>
        new Promise((res, rej) => {
          const r = indexedDB.open('WorkoutTrackerDb')
          r.onsuccess = () => res(r.result)
          r.onerror = () => rej(r.error)
        })
      const db = await open()
      const startOfDay = (ms) => {
        const d = new Date(ms)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      }
      const today = startOfDay(Date.now())
      const DAY = 86400000

      const habitRows = habits.map((h, index) => ({
        id: `qa-habit-${index}`,
        name: h.name,
        icon: h.icon,
        description: null,
        accent: h.accent,
        schedule: { type: 'daily' },
        kind: h.kind,
        autoLink: null,
        archivedAt: null,
        orderIndex: index,
        createdAt: today - 120 * DAY,
      }))

      const entryRows = []
      if (entries) {
        habitRows.forEach((h, hi) => {
          // Deterministic pseudo-history over the past 10 weeks, skipping today
          // so every habit starts the QA run incomplete and tickable.
          for (let back = 1; back <= 70; back += 1) {
            if ((back * 7 + hi * 3) % 10 < 4) continue
            const date = today - back * DAY
            const full = h.kind.type === 'quantity' ? h.kind.target : 1
            const partial = h.kind.type === 'quantity' ? Math.round(h.kind.target * 0.4) : 1
            const value = (back + hi) % 5 === 0 ? partial : full
            entryRows.push({
              id: `qa-entry-${hi}-${back}`,
              habitId: h.id,
              date,
              value,
              recordedAt: date + 3600000,
            })
          }
        })
      }

      const stores = ['habits', 'habitEntries', 'onboarding', 'settings']
      await new Promise((res, rej) => {
        const tx = db.transaction(stores, 'readwrite')
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error)
        const habitsStore = tx.objectStore('habits')
        const entriesStore = tx.objectStore('habitEntries')
        habitsStore.clear()
        entriesStore.clear()
        habitRows.forEach((row) => habitsStore.put(row))
        entryRows.forEach((row) => entriesStore.put(row))
        tx.objectStore('onboarding').put({ id: 'onboarding', completed: true, currentStep: 99 })
        const settings = tx.objectStore('settings')
        settings.delete('habitViewMode')
        if (viewMode) settings.put({ key: 'habitViewMode', value: viewMode })
      })
      db.close()
      return { habits: habitRows.length, entries: entryRows.length }
    },
    { habits, entries, viewMode },
  )
}

export async function readSetting(page, key) {
  return page.evaluate(async (key) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('WorkoutTrackerDb')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const value = await new Promise((res, rej) => {
      const req = db.transaction('settings').objectStore('settings').get(key)
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    db.close()
    return value ?? null
  }, key)
}

export async function readEntries(page, habitId) {
  return page.evaluate(async (habitId) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('WorkoutTrackerDb')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const all = await new Promise((res, rej) => {
      const req = db.transaction('habitEntries').objectStore('habitEntries').getAll()
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    db.close()
    return all.filter((e) => e.habitId === habitId)
  }, habitId)
}

export async function shot(page, name) {
  await page.screenshot({ path: `${EVIDENCE}/${name}.png` })
  return `${EVIDENCE}/${name}.png`
}
