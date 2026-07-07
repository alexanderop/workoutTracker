/**
 * Minimal, dependency-free recovery UI rendered when the Vue app fails to
 * mount.
 *
 * UX review finding M3: once, `#app` stayed empty with no console output at
 * all; a reload fixed it, but the failure was invisible and unexplained.
 * This function is the last line of defense — it must survive even if Vue,
 * i18n, or the router themselves are the reason mounting failed, so it is
 * deliberately plain DOM with no imports from the app. Text is hardcoded in
 * English rather than localized for the same reason.
 */
export function renderMountFailure(container: Element, error: unknown): void {
  console.error('[main] Failed to mount app', error)

  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.dataset.testid = 'mount-recovery'
  wrapper.style.cssText =
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'gap:1rem;min-height:100vh;padding:1.5rem;text-align:center;' +
    'font-family:system-ui,-apple-system,sans-serif;'

  const heading = document.createElement('h1')
  heading.textContent = 'Something went wrong'
  heading.style.cssText = 'font-size:1.25rem;font-weight:600;margin:0;'

  const message = document.createElement('p')
  message.textContent = 'The app failed to start. Reloading usually fixes this.'
  message.style.cssText = 'color:#666;margin:0;max-width:24rem;'

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Reload'
  button.style.cssText =
    'padding:0.6rem 1.5rem;border-radius:0.5rem;border:none;' +
    'background:#111827;color:#fff;font-size:1rem;cursor:pointer;'
  button.addEventListener('click', () => {
    globalThis.location.reload()
  })

  wrapper.append(heading, message, button)
  container.append(wrapper)
}
