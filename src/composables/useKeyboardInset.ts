import type { ConfigurableDocument } from '@vueuse/core'
import { defaultDocument, defaultWindow, tryOnScopeDispose, useEventListener } from '@vueuse/core'

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
type KeyboardViewport = EventTarget & Pick<VisualViewport, 'height' | 'offsetTop' | 'scale'>
type KeyboardWindow = Pick<Window, 'innerHeight'> & {
  visualViewport?: KeyboardViewport | null
}

export type UseKeyboardInsetOptions = ConfigurableDocument & {
  window?: KeyboardWindow
}

export function useKeyboardInset(options: UseKeyboardInsetOptions = {}): () => void {
  const { window = defaultWindow } = options
  const document = options.document ?? defaultDocument
  const viewport = window?.visualViewport
  if (!window || !document || !viewport) return () => {}
  const browserWindow = window
  const browserDocument = document

  function update(): void {
    if (!viewport) return
    // Pinch-zoom also shrinks the visual viewport; only track keyboard-like insets.
    const inset =
      viewport.scale === 1
        ? Math.max(0, browserWindow.innerHeight - viewport.height - viewport.offsetTop)
        : 0
    browserDocument.documentElement.style.setProperty(
      KEYBOARD_INSET_PROPERTY,
      `${Math.round(inset)}px`,
    )
  }

  // iOS reveals a focused input by panning (scrolling) the layout viewport
  // instead of resizing it, so the scroll listener is required, not optional.
  const stopResize = useEventListener(viewport, 'resize', update, { passive: true })
  const stopScroll = useEventListener(viewport, 'scroll', update, { passive: true })
  update()

  function stop(): void {
    stopResize()
    stopScroll()
    browserDocument.documentElement.style.removeProperty(KEYBOARD_INSET_PROPERTY)
  }

  tryOnScopeDispose(stop)
  return stop
}
