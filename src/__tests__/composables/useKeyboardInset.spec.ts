import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { useKeyboardInset } from '@/composables/useKeyboardInset'

describe('useKeyboardInset', () => {
  it('uses injected browser globals and removes its side effect when stopped', async () => {
    const viewport = Object.assign(new EventTarget(), {
      height: 500,
      offsetTop: 0,
      scale: 1,
    })
    const injectedWindow = {
      innerHeight: 800,
      visualViewport: viewport,
    }

    const stop = useKeyboardInset({ window: injectedWindow, document })

    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('300px')

    Object.assign(viewport, { height: 600 })
    await nextTick()
    viewport.dispatchEvent(new Event('resize'))
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('200px')

    stop()
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('')
  })
})
