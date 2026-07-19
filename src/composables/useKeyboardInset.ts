import { useEventListener } from '@vueuse/core'

const KEYBOARD_INSET_PROPERTY = '--keyboard-inset'

/**
 * Tracks the on-screen keyboard and exposes its height as the
 * `--keyboard-inset` CSS custom property (px) on `<html>`.
 *
 * Bottom sheets use it (`bottom-[var(--keyboard-inset,0px)]`, height caps) to
 * stay above the keyboard on browsers where the keyboard only shrinks the
 * visual viewport — iOS Safari always, Android Chrome 108+ without the
 * `interactive-widget=resizes-content` viewport meta. With that meta active
 * (see index.html) the layout viewport shrinks too, so `window.innerHeight`
 * drops in step and the computed inset stays ~0 — no double compensation.
 *
 * Call once at app root.
 */
export function useKeyboardInset(): void {
  const viewport = window.visualViewport
  if (!viewport) return

  function update(): void {
    if (!viewport) return
    // Pinch-zoom also shrinks the visual viewport; only track keyboard-like insets.
    const inset =
      viewport.scale === 1
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0
    document.documentElement.style.setProperty(KEYBOARD_INSET_PROPERTY, `${Math.round(inset)}px`)
  }

  // iOS reveals a focused input by panning (scrolling) the layout viewport
  // instead of resizing it, so the scroll listener is required, not optional.
  useEventListener(viewport, 'resize', update, { passive: true })
  useEventListener(viewport, 'scroll', update, { passive: true })
  update()
}
