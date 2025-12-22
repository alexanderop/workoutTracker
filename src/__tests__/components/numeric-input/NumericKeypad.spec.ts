import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import NumericKeypad from '@/components/ui/numeric-input/NumericKeypad.vue'

describe('NumericKeypad', () => {
  it('renders all digit buttons 0-9', async () => {
    render(NumericKeypad, {
      props: {
        modelValue: 0,
      },
    })

    // All digits should be visible
    for (const digit of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
      await expect.element(page.getByRole('button', { name: digit })).toBeVisible()
    }
  })

  it('renders backspace button', async () => {
    render(NumericKeypad, {
      props: {
        modelValue: 0,
      },
    })

    await expect.element(page.getByRole('button', { name: /backspace|delete/i })).toBeVisible()
  })

  it('emits update when digit is pressed', async () => {
    const onUpdate = vi.fn()
    render(NumericKeypad, {
      props: {
        modelValue: 20,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await userEvent.click(page.getByRole('button', { name: '5' }))

    expect(onUpdate).toHaveBeenCalledWith(205)
  })

  it('replaces zero with digit when current value is 0', async () => {
    const onUpdate = vi.fn()
    render(NumericKeypad, {
      props: {
        modelValue: 0,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await userEvent.click(page.getByRole('button', { name: '5' }))

    expect(onUpdate).toHaveBeenCalledWith(5)
  })

  it('prevents appending zero to zero', async () => {
    const onUpdate = vi.fn()
    render(NumericKeypad, {
      props: {
        modelValue: 0,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await userEvent.click(page.getByRole('button', { name: '0' }))

    // Value stays at 0 - Vue doesn't emit when value doesn't change
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('removes last digit on backspace', async () => {
    const onUpdate = vi.fn()
    render(NumericKeypad, {
      props: {
        modelValue: 205,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await userEvent.click(page.getByRole('button', { name: /backspace|delete/i }))

    expect(onUpdate).toHaveBeenCalledWith(20)
  })

  it('sets to 0 when all digits removed', async () => {
    const onUpdate = vi.fn()
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

    // Try to make it 999
    await userEvent.click(page.getByRole('button', { name: '9' }))

    // Should stay at 99 since 999 > 100 - Vue doesn't emit when value doesn't change
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
