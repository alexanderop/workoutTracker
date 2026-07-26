import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/i18n'
import en from '@/i18n/messages/en'
import DesignSystemView from '@/features/design-system/views/DesignSystemView.vue'
import { DesignStudioPO } from '../../helpers/pages'

/**
 * The studio's own behaviour, exercised through the rendered DOM.
 *
 * The pure helpers (viewport maths, control reads, theme serialisation) are
 * covered in the unit tier; what matters here is the wiring those helpers can't
 * prove — that the inspector actually drives the real component, and that a
 * theme edit actually reaches the CSS custom properties.
 */
async function renderStudio(): Promise<DesignStudioPO> {
  i18n.global.setLocaleMessage('en', en)
  i18n.global.locale.value = 'en'

  // The studio is desktop-shaped on purpose: the layers panel is `md:` gated
  // and the inspector `lg:`. At the default test viewport both are display:none
  // and nothing here would be reachable.
  await page.viewport(1440, 900)

  const router = createRouter({ history: createMemoryHistory(), routes })
  render(DesignSystemView, { global: { plugins: [i18n, router] } })

  return new DesignStudioPO()
}

describe('design studio', () => {
  it('renders artboards for the catalog sections', async () => {
    const studio = await renderStudio()

    await expect.element(studio.sectionHeading('Foundations')).toBeVisible()
    await expect.element(studio.sectionHeading('Components')).toBeVisible()
    await expect.element(studio.sectionHeading('Screens')).toBeVisible()
  })

  it('renders the real components inside the frames', async () => {
    await renderStudio()

    // Straight from ButtonsFrame's variant gallery, which is typed off the
    // cva variant union — if a variant is renamed this stops matching.
    await expect.element(page.getByRole('button', { name: 'destructive' })).toBeVisible()
  })

  it('shows the selected frame in the inspector', async () => {
    const studio = await renderStudio()

    await studio.selectFrame('Button')

    await expect.element(studio.inspectorTitle()).toBeVisible()
    await expect.element(page.getByText('Properties')).toBeVisible()
  })

  it('drives the real component from an inspector control', async () => {
    const studio = await renderStudio()
    await studio.selectFrame('Button')

    const playground = studio.playgroundButton()
    await expect.element(playground).toBeVisible()
    expect(await studio.playgroundClassList()).toContain('bg-primary')

    await studio.setVariant('destructive')

    // Same element, now carrying the destructive variant's real classes.
    expect(await studio.playgroundClassList()).toContain('bg-destructive')
  })

  it('retitles the playground button from the text control', async () => {
    const studio = await renderStudio()
    await studio.selectFrame('Button')

    await studio.setLabel('Finish set')

    await expect.element(page.getByRole('button', { name: 'Finish set' })).toBeVisible()
  })

  it('repaints the studio when the theme lab changes primary', async () => {
    const studio = await renderStudio()

    const before = await studio.rootPrimary()
    await studio.openThemeTab()
    await studio.applyPreset('Forest')

    const after = await studio.rootPrimary()
    expect(after).not.toBe(before)
    expect(after).toMatch(/^oklch\(/)
  })

  it('leaves the theme untouched until an edit is made', async () => {
    const studio = await renderStudio()

    await studio.openThemeTab()

    // No inline override before the first edit, so the studio shows the app's
    // real theme — including dark mode's own primary.
    expect(await studio.rootPrimary()).toBe('')
  })

  it('restores the default theme on reset', async () => {
    const studio = await renderStudio()
    await studio.openThemeTab()

    await studio.applyPreset('Ember')
    expect(await studio.rootPrimary()).not.toBe('')

    await studio.resetTheme()

    expect(await studio.rootPrimary()).toBe('')
  })
})
