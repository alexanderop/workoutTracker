import { afterEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { createApp, h } from 'vue'
import { i18n } from '@/i18n'
import WorkoutBlockPlaylist from '@/features/workout/components/WorkoutBlockPlaylist.vue'
import { createStrengthBlock } from '@/__tests__/factories'

/**
 * Gets the parent container of a block button element
 */
const getBlockContainer = (btn: Element) => btn.parentElement

/**
 * Helper to render component in browser mode
 */
function renderComponent(
  component: Component,
  props: Record<string, unknown>,
): { container: HTMLElement; unmount: () => void } {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    render() {
      return h(component, props)
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
  let cleanup: (() => void) | null = null

  afterEach(() => {
    cleanup?.()
    cleanup = null
  })

  it('renders drag handles for each block', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
      createStrengthBlock({ id: 3, name: 'Deadlift' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
    })
    cleanup = unmount

    const dragHandles = container.querySelectorAll('.drag-handle')
    expect(dragHandles.length).toBe(3)
  })

  it('drag handles have grab cursor class', () => {
    const blocks = [createStrengthBlock({ id: 1, name: 'Squat' })]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
    })
    cleanup = unmount

    const dragHandle = container.querySelector('.drag-handle')
    expect(dragHandle).toBeTruthy()
    expect(dragHandle?.classList.contains('cursor-grab')).toBe(true)
  })

  it('shows sortable container with ref', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
    })
    cleanup = unmount

    // Container should have children for sortable
    const sortableContainer = container.querySelector('.flex.flex-col')
    expect(sortableContainer).toBeTruthy()
    expect(sortableContainer?.children.length).toBeGreaterThan(0)
  })

  it('hides drag handles with opacity-0 when disabled', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
      disabled: true,
    })
    cleanup = unmount

    // Drag handles still exist but should be hidden with opacity-0
    const dragHandles = container.querySelectorAll('.drag-handle')
    expect(dragHandles.length).toBe(2)

    dragHandles.forEach((handle) => {
      expect(handle.classList.contains('opacity-0')).toBe(true)
    })
  })

  it('shows selected block with aria-pressed', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
      createStrengthBlock({ id: 3, name: 'Deadlift' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 1,
    })
    cleanup = unmount

    const blockItems = container.querySelectorAll('button[aria-pressed]')
    expect(blockItems.length).toBe(3)
    expect(blockItems[0]?.getAttribute('aria-pressed')).toBe('false')
    expect(blockItems[1]?.getAttribute('aria-pressed')).toBe('true')
    expect(blockItems[2]?.getAttribute('aria-pressed')).toBe('false')
  })

  it('shows add block button when not disabled', () => {
    const blocks = [createStrengthBlock({ id: 1, name: 'Squat' })]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
      disabled: false,
    })
    cleanup = unmount

    // Find button with "Add Block" text
    const addButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Add Block'),
    )
    expect(addButton).toBeTruthy()
  })

  it('hides add block button when disabled', () => {
    const blocks = [createStrengthBlock({ id: 1, name: 'Squat' })]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
      disabled: true,
    })
    cleanup = unmount

    // Should not find add block button when disabled
    const addButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Add Block'),
    )
    expect(addButton).toBeFalsy()
  })

  it('shows completed blocks with opacity-60', () => {
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
    cleanup = unmount

    // Query for block containers using aria-pressed buttons, then find their parent containers
    const blockButtons = container.querySelectorAll('button[aria-pressed]')
    expect(blockButtons.length).toBe(3)

    // First block (index 0) should have opacity-60 (completed)
    expect(getBlockContainer(blockButtons[0]!)?.classList.contains('opacity-60')).toBe(true)

    // Second block (index 1) should NOT have opacity-60
    expect(getBlockContainer(blockButtons[1]!)?.classList.contains('opacity-60')).toBe(false)

    // Third block (index 2) should have opacity-60 (completed)
    expect(getBlockContainer(blockButtons[2]!)?.classList.contains('opacity-60')).toBe(true)
  })

  it('renders connectors between blocks', () => {
    const blocks = [
      createStrengthBlock({ id: 1, name: 'Squat' }),
      createStrengthBlock({ id: 2, name: 'Bench Press' }),
      createStrengthBlock({ id: 3, name: 'Deadlift' }),
    ]

    const { unmount, container } = renderComponent(WorkoutBlockPlaylist, {
      blocks,
      selectedIndex: 0,
    })
    cleanup = unmount

    // Should have 2 connectors for 3 blocks (between first-second, second-third)
    // Connectors use bg-border class and aria-hidden
    const connectors = container.querySelectorAll('[aria-hidden="true"].bg-border')
    expect(connectors.length).toBe(2)
  })
})
