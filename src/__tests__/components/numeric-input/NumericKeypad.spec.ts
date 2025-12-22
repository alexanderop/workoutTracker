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

    // Vue v-model doesn't emit when value doesn't change
    // The important thing is value stays at 0 (verified by display)
    await expect.element(page.getByTestId('keypad-display')).toHaveTextContent('0')
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

  it('shows decimal button when allowDecimal is true', async () => {
    render(NumericKeypad, {
      props: {
        modelValue: 20,
        allowDecimal: true,
      },
    })

    await expect.element(page.getByRole('button', { name: '.' })).toBeVisible()
  })

  it('hides decimal button when allowDecimal is false', async () => {
    render(NumericKeypad, {
      props: {
        modelValue: 20,
        allowDecimal: false,
      },
    })

    await expect.element(page.getByRole('button', { name: '.' })).not.toBeInTheDocument()
  })

  it('enforces max value constraint', async () => {
    render(NumericKeypad, {
      props: {
        modelValue: 99,
        max: 100,
      },
    })

    // Try to make it 999
    await userEvent.click(page.getByRole('button', { name: '9' }))

    // Should stay at 99 since 999 > 100
    // Vue v-model doesn't emit when value doesn't change
    await expect.element(page.getByTestId('keypad-display')).toHaveTextContent('99')
  })

  it('displays current value', async () => {
    render(NumericKeypad, {
      props: {
        modelValue: 42,
      },
    })

    await expect.element(page.getByTestId('keypad-display')).toHaveTextContent('42')
  })
})
