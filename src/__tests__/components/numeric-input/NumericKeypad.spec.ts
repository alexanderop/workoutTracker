import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import NumericKeypad from '@/components/ui/numeric-input/NumericKeypad.vue'

describe('NumericKeypad', () => {
  it('renders all digit buttons and the backspace control', async () => {
    render(NumericKeypad, {
      props: {
        modelValue: 0,
      },
    })

    // All digits should be visible
    for (const digit of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
      await expect.element(page.getByRole('button', { name: digit })).toBeVisible()
    }

    await expect.element(page.getByRole('button', { name: /backspace|delete/i })).toBeVisible()
  })

  it('emits normalized digit updates for existing values and zero', async () => {
    const onUpdate = vi.fn()
    const { unmount } = render(NumericKeypad, {
      props: {
        modelValue: 20,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // First press backspace to exit fresh-start mode (calculator-style behavior)
    await userEvent.click(page.getByRole('button', { name: /backspace|delete/i }))

    // Now press digit - should append
    await userEvent.click(page.getByRole('button', { name: '5' }))

    // 20 -> backspace -> 2 -> append 5 -> 25
    expect(onUpdate).toHaveBeenCalledWith(25)
    unmount()
    onUpdate.mockClear()

    render(NumericKeypad, {
      props: {
        modelValue: 0,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await userEvent.click(page.getByRole('button', { name: '0' }))

    // Value stays at 0 - Vue doesn't emit when value doesn't change
    expect(onUpdate).not.toHaveBeenCalled()

    await userEvent.click(page.getByRole('button', { name: '5' }))

    expect(onUpdate).toHaveBeenCalledWith(5)
  })

  it('backspaces a multi-digit value and resets a single digit to zero', async () => {
    const onUpdate = vi.fn()
    const { unmount } = render(NumericKeypad, {
      props: {
        modelValue: 205,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await userEvent.click(page.getByRole('button', { name: /backspace|delete/i }))

    expect(onUpdate).toHaveBeenCalledWith(20)
    unmount()
    onUpdate.mockClear()

    render(NumericKeypad, {
      props: {
        modelValue: 5,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await userEvent.click(page.getByRole('button', { name: /backspace|delete/i }))

    expect(onUpdate).toHaveBeenCalledWith(0)
  })

  it('enforces max value constraint', async () => {
    const onUpdate = vi.fn()
    render(NumericKeypad, {
      props: {
        modelValue: 99,
        max: 100,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // First exit fresh-start mode by pressing backspace
    await userEvent.click(page.getByRole('button', { name: /backspace|delete/i })) // 99 → 9
    expect(onUpdate).toHaveBeenCalledWith(9)
    onUpdate.mockClear()

    // Append to get back to 99
    await userEvent.click(page.getByRole('button', { name: '9' })) // 9 → 99
    expect(onUpdate).toHaveBeenCalledWith(99)
    onUpdate.mockClear()

    // Try to make it 999 - should be blocked by max constraint
    await userEvent.click(page.getByRole('button', { name: '9' }))

    // Should stay at 99 since 999 > 100 - Vue doesn't emit when value doesn't change
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
