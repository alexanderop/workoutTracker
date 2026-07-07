import { page } from 'vitest/browser'
import { afterEach, describe, expect, it } from 'vitest'
import { renderMountFailure } from '@/lib/mountRecovery'

/**
 * UX review finding M3: once, `#app` stayed empty with no console output at
 * all; a reload fixed it, but the failure was invisible. `renderMountFailure`
 * is the plain-DOM fallback `src/main.ts` renders when `app.mount()` throws.
 *
 * This only verifies the fallback markup itself renders correctly. It does
 * NOT click the reload button — that calls `location.reload()`, which would
 * reload the real browser page mid test run (see the `isBrowserMode` guard
 * in `data-management.spec.ts` for the same constraint).
 */
describe('renderMountFailure', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the recovery markup into the given container', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    renderMountFailure(container, new Error('boom'))

    await expect.element(page.getByTestId('mount-recovery')).toBeVisible()
  })

  it('is discoverable via accessible roles, not just DOM structure', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    renderMountFailure(container, new Error('boom'))

    await expect.element(page.getByRole('heading')).toBeVisible()
    await expect.element(page.getByRole('button', { name: /reload/i })).toBeVisible()
  })

  it('clears any existing content in the container before rendering', () => {
    const container = document.createElement('div')
    container.innerHTML = '<p>stale content that should be replaced</p>'
    document.body.append(container)

    renderMountFailure(container, new Error('boom'))

    expect(container.textContent).not.toContain('stale content')
  })
})
