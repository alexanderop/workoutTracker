import { afterEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { createApp, h } from 'vue'
import { i18n } from '@/i18n'
import WorkoutBlockPlaylist from '@/blocks/ui/WorkoutBlockPlaylist.vue'
import { createStrengthBlock } from '@/__tests__/factories'

/**
 * Gets the parent container of a block button element
 */
const getBlockContainer = (button: Element) => button.parentElement

/**
 * Helper to render component in browser mode
 */
function renderComponent(
  component: Component,
  properties: Record<string, unknown>,
): { container: HTMLElement; unmount: () => void } {
  const container = document.createElement('div')
  document.body.append(container)

  const app = createApp({
    render() {
      return h(component, properties)
    },
  })

  app.use(i18n)
  app.mount(container)

  return {
    container,
    unmount: () => {
      app.unmount()
      container.remove()
    },
  }
}

/**
 * Browser tests for drag-and-drop reordering in WorkoutBlockPlaylist.
 * Tests real browser drag behavior that cannot be simulated in jsdom.
 */
describe('WorkoutBlockPlaylist - drag and drop', () => {
  const context: { cleanup: (() => void) | null } = { cleanup: null }

  afterEach(() => {
    context.cleanup?.()
    context.cleanup = null
  })

  it('renders an enabled sortable playlist with handles, connectors, and add action', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
      createStrengthBlock({ id: 3, name: 'Deadlift' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
    })
    context.cleanup = unmount

    // eslint-disable-next-line no-restricted-syntax -- Testing CSS class implementation, not user-facing behavior
    const dragHandles = container.querySelectorAll('.drag-handle')
    expect(dragHandles).toHaveLength(3)
    for (const handle of dragHandles) {
      expect(handle.classList.contains('cursor-grab')).toBe(true)
    }

    // Container should have children for sortable
    // eslint-disable-next-line no-restricted-syntax -- Testing CSS layout class implementation
    const sortableContainer = container.querySelector('.flex.flex-col')
    expect(sortableContainer).toBeTruthy()
    expect(sortableContainer?.children.length).toBeGreaterThan(0)

    // eslint-disable-next-line no-restricted-syntax -- Custom render uses raw DOM, not page locators
    const addButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Add Block'),
    )
    expect(addButton).toBeTruthy()

    // Two connectors join the three blocks.
    // eslint-disable-next-line no-restricted-syntax -- Testing CSS class + aria-hidden implementation
    const connectors = container.querySelectorAll('[aria-hidden="true"].bg-border')
    expect(connectors).toHaveLength(2)
  })

  it('keeps disabled drag handles in layout but hides them and the add action', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
      disabled: true,
    })
    context.cleanup = unmount

    // Drag handles still exist but should be hidden with opacity-0
    // eslint-disable-next-line no-restricted-syntax -- Testing CSS class implementation
    const dragHandles = container.querySelectorAll('.drag-handle')
    expect(dragHandles).toHaveLength(2)

    for (const handle of dragHandles) {
      expect(handle.classList.contains('opacity-0')).toBe(true)
    }

    // Should not find add block button when disabled
    // eslint-disable-next-line no-restricted-syntax -- Custom render uses raw DOM, not page locators
    const addButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Add Block'),
    )
    expect(addButton).toBeFalsy()
  })

  it('exposes selection and completed-block state independently', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
      createStrengthBlock({ id: 3, name: 'Deadlift' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 1,
      completedBlocks: [0, 2],
    })
    context.cleanup = unmount

    // Query for block containers using aria-pressed buttons, then find their parent containers
    // eslint-disable-next-line no-restricted-syntax -- Testing aria-pressed + parent CSS classes requires DOM access
    const blockButtons = container.querySelectorAll('button[aria-pressed]')
    expect(blockButtons).toHaveLength(3)
    expect(blockButtons[0]?.getAttribute('aria-pressed')).toBe('false')
    expect(blockButtons[1]?.getAttribute('aria-pressed')).toBe('true')
    expect(blockButtons[2]?.getAttribute('aria-pressed')).toBe('false')

    // First block (index 0) should have opacity-60 (completed)
    expect(getBlockContainer(blockButtons[0]!)?.classList.contains('opacity-60')).toBe(true)

    // Second block (index 1) should NOT have opacity-60
    expect(getBlockContainer(blockButtons[1]!)?.classList.contains('opacity-60')).toBe(false)

    // Third block (index 2) should have opacity-60 (completed)
    expect(getBlockContainer(blockButtons[2]!)?.classList.contains('opacity-60')).toBe(true)
  })
})
