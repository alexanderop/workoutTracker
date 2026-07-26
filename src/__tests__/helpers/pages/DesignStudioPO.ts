import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import { ensureHTMLElement } from '../domHelpers'

/**
 * Page Object for the design studio at /design.
 *
 * Reads go through roles and visible text the way a user would find them; the
 * only DOM-level access is the studio root's inline custom properties, which
 * are the theme lab's actual output and have no accessible surface.
 */
export class DesignStudioPO {
  sectionHeading(name: string) {
    return page.getByRole('heading', { name, exact: true })
  }

  inspectorTitle() {
    return page.getByRole('heading', { name: 'Button', exact: true })
  }

  /** The layers-panel row, which both selects the frame and jumps to it. */
  async selectFrame(name: string): Promise<void> {
    await userEvent.click(page.getByRole('button', { name, exact: true }).first())
  }

  playgroundButton() {
    return page.getByRole('button', { name: /log set/i }).first()
  }

  async playgroundClassList(): Promise<string> {
    const element = await this.playgroundButton().element()
    return ensureHTMLElement(element).className
  }

  async setVariant(variant: string): Promise<void> {
    const select = await page.getByLabelText('Variant').element()
    const element = ensureHTMLElement(select)
    if (!(element instanceof HTMLSelectElement)) {
      throw new TypeError('Variant control is not a <select>')
    }
    await userEvent.selectOptions(element, variant)
  }

  async setLabel(text: string): Promise<void> {
    const input = await page.getByLabelText('Label').element()
    await userEvent.fill(ensureHTMLElement(input), text)
  }

  async toggleSwitch(label: string): Promise<void> {
    await userEvent.click(page.getByRole('switch', { name: label }))
  }

  /**
   * The canvas auto-fits once, on the first non-zero measurement of the world.
   * A real user cannot click before that lands, but a synthetic click can — and
   * the fit would then overwrite it. Settle first so zoom assertions are stable.
   *
   * The studio's frames are far wider than any test viewport, so the initial fit
   * always scales below 1; `scale(1)` means the fit has not run yet.
   */
  async waitForInitialFit(): Promise<void> {
    await expect.poll(() => this.worldTransform()).not.toContain('scale(1)')
  }

  // --- Canvas navigation, driven through the toolbar's accessible controls.

  async zoomIn(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }))
  }

  async zoomOut(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Zoom out' }))
  }

  async fitToScreen(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Fit canvas to screen' }))
  }

  async resetZoom(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Reset zoom to 100%' }))
  }

  /** The toolbar's zoom readout doubles as the reset control, so it is named. */
  zoomReadout() {
    return page.getByRole('button', { name: 'Reset zoom to 100%' })
  }

  async zoomPercent(): Promise<number> {
    const element = await this.zoomReadout().element()
    return Number.parseInt(ensureHTMLElement(element).textContent ?? '', 10)
  }

  /**
   * The canvas transform has no accessible equivalent — panning and zooming are
   * purely visual — so this is the one place the Page Object reads the DOM.
   */
  async worldTransform(): Promise<string> {
    const world = await page.getByTestId('design-world').element()
    return ensureHTMLElement(world).style.transform
  }

  async openThemeTab(): Promise<void> {
    await userEvent.click(page.getByRole('tab', { name: 'Theme' }))
  }

  async applyPreset(name: string): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: `Use the ${name} primary` }))
  }

  /** Exact, so this never picks up the toolbar's "Reset zoom to 100%". */
  async resetTheme(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Reset', exact: true }))
  }

  /**
   * The `--primary` override the theme lab writes onto the studio root.
   * Empty string means no override is applied — the untouched state.
   *
   * Read off the element rather than through a role: an inline custom property
   * is the theme lab's actual output and has no accessible surface to assert on.
   */
  async rootPrimary(): Promise<string> {
    const root = await page.getByTestId('design-studio').element()
    return ensureHTMLElement(root).style.getPropertyValue('--primary')
  }
}
