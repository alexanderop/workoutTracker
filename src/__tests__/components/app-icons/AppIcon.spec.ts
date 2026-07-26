import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { AppIcon, appIconKeys, getAppIcon, isAppIconKey } from '@/components/app-icons'

/** Anything outside the ASCII printable range would be an emoji sneaking back in. */
const NON_ASCII_PATTERN = /[^ -~]/

/**
 * Every key `normalizeDbHabit`'s legacy emoji table can produce.
 *
 * That table lives in `src/db/converters.ts` as plain strings -- the database
 * layer deliberately holds no UI types -- so this is the seam the compiler
 * cannot check. Listing it in full means renaming or dropping any of these keys
 * fails here instead of silently blanking a migrated habit.
 */
const MIGRATED_HABIT_ICON_KEYS = [
  'habit-water',
  'habit-run',
  'habit-strength',
  'habit-meditate',
  'habit-read',
  'habit-journal',
  'habit-sleep',
  'habit-nutrition',
  'habit-no-smoke',
  'habit-clean',
  'habit-check',
  'habit-progress',
  'habit-default',
]

describe('app icon inventory', () => {
  it('bundles artwork for every key the habit migration can produce', () => {
    for (const key of MIGRATED_HABIT_ICON_KEYS) {
      expect(isAppIconKey(key), `${key} has no bundled artwork`).toBe(true)
    }
  })

  it('rejects unknown keys', () => {
    expect(isAppIconKey('habit-teleport')).toBe(false)
    expect(isAppIconKey('💧')).toBe(false)
    expect(isAppIconKey(null)).toBe(false)
  })

  it('carries an ASCII-only developer title for every icon', () => {
    for (const key of appIconKeys) {
      const { title } = getAppIcon(key)
      expect(title).not.toBe('')
      expect(NON_ASCII_PATTERN.test(title)).toBe(false)
    }
  })
})

describe('AppIcon', () => {
  it('renders decorative artwork with stable data hooks and caller classes', async () => {
    render(AppIcon, { props: { name: 'equipment-barbell', class: 'size-7 text-primary' } })

    const icon = page.getByTestId('app-icon-equipment-barbell')
    await expect.element(icon).toHaveAttribute('data-icon', 'equipment-barbell')
    await expect.element(icon).toHaveAttribute('aria-hidden', 'true')
    await expect.element(icon).toHaveClass('size-7')
    await expect.element(icon).toHaveClass('text-primary')
  })

  it('announces the caller label for labeled artwork, never the English title', async () => {
    // A non-decorative icon without a `label` is a type error, so the German
    // screen can never fall back to the registry's "Core".
    render(AppIcon, { props: { name: 'muscle-core', decorative: false, label: 'Bauchmuskeln' } })

    await expect.element(page.getByRole('img', { name: 'Bauchmuskeln' })).toBeVisible()
    expect(getAppIcon('muscle-core').title).toBe('Core')
    await expect.element(page.getByRole('img', { name: 'Core' })).not.toBeInTheDocument()
  })

  it('renders every icon as a consistent 48 by 48 SVG with no text glyphs', async () => {
    for (const key of appIconKeys) {
      const { unmount } = render(AppIcon, { props: { name: key } })
      const icon = page.getByTestId(`app-icon-${key}`)
      await expect.element(icon).toHaveAttribute('viewBox', '0 0 48 48')
      expect(icon.element().textContent ?? '').toBe('')
      unmount()
    }
  })
})
