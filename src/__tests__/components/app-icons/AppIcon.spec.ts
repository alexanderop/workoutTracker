import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { AppIcon, appIconKeys, getAppIcon, isAppIconKey } from '@/components/app-icons'

/** Anything outside the ASCII printable range would be an emoji sneaking back in. */
const NON_ASCII_PATTERN = /[^ -~]/

describe('app icon inventory', () => {
  it('covers every emoji the app used to render inline', () => {
    for (const key of [
      'equipment-barbell',
      'muscle-chest',
      'habit-water',
      'habit-default',
      'mood-okay',
      'trophy',
      'celebrate',
    ]) {
      expect(isAppIconKey(key)).toBe(true)
    }
  })

  it('rejects unknown keys', () => {
    expect(isAppIconKey('habit-teleport')).toBe(false)
    expect(isAppIconKey('💧')).toBe(false)
    expect(isAppIconKey(null)).toBe(false)
  })

  it('carries an ASCII-only fallback title for every icon', () => {
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

  it('uses the registry title or a caller label for labeled artwork', async () => {
    render(AppIcon, { props: { name: 'trophy', decorative: false } })
    await expect.element(page.getByRole('img', { name: 'Personal best' })).toBeVisible()

    render(AppIcon, { props: { name: 'muscle-core', decorative: false, label: 'Bauchmuskeln' } })
    await expect.element(page.getByRole('img', { name: 'Bauchmuskeln' })).toBeVisible()
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
