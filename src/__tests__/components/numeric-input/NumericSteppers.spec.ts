import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import NumericSteppers from '@/components/ui/numeric-input/NumericSteppers.vue'

describe('NumericSteppers', () => {
  it('renders increment and decrement buttons', async () => {
    render(NumericSteppers, {
      props: {
        modelValue: 20,
      },
    })

    // Should have 4 buttons: large decrement, small decrement, small increment, large increment
    const decrementButtons = page.getByRole('button', { name: /decrement/i })
    const incrementButtons = page.getByRole('button', { name: /increment/i })

    await expect.element(decrementButtons.first()).toBeVisible()
    await expect.element(incrementButtons.first()).toBeVisible()
  })

  it('displays current value in center', async () => {
    render(NumericSteppers, {
      props: {
        modelValue: 42,
      },
    })

    await expect.element(page.getByTestId('stepper-display')).toHaveTextContent('42')
  })

  it('increments by small step on small increment click', async () => {
    const onUpdate = vi.fn()
    render(NumericSteppers, {
      props: {
        modelValue: 20,
        smallStep: 1,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Click small increment button
    await userEvent.click(page.getByRole('button', { name: /increment by 1/i }))

    expect(onUpdate).toHaveBeenCalledWith(21)
  })

  it('increments by large step on large increment click', async () => {
    const onUpdate = vi.fn()
    render(NumericSteppers, {
      props: {
        modelValue: 20,
        largeStep: 5,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Click large increment button
    await userEvent.click(page.getByRole('button', { name: /increment by 5/i }))

    expect(onUpdate).toHaveBeenCalledWith(25)
  })

  it('decrements by small step on small decrement click', async () => {
    const onUpdate = vi.fn()
    render(NumericSteppers, {
      props: {
        modelValue: 20,
        smallStep: 1,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Click small decrement button
    await userEvent.click(page.getByRole('button', { name: /decrement by 1/i }))

    expect(onUpdate).toHaveBeenCalledWith(19)
  })

  it('decrements by large step on large decrement click', async () => {
    const onUpdate = vi.fn()
    render(NumericSteppers, {
      props: {
        modelValue: 20,
        largeStep: 5,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Click large decrement button
    await userEvent.click(page.getByRole('button', { name: /decrement by 5/i }))

    expect(onUpdate).toHaveBeenCalledWith(15)
  })

  it('disables decrement buttons at min value', async () => {
    render(NumericSteppers, {
      props: {
        modelValue: 0,
        min: 0,
      },
    })

    // Both decrement buttons should be disabled
    const decrementSmall = page.getByRole('button', { name: /decrement by 1/i })
    const decrementLarge = page.getByRole('button', { name: /decrement by 5/i })

    await expect.element(decrementSmall).toBeDisabled()
    await expect.element(decrementLarge).toBeDisabled()
  })

  it('disables increment buttons at max value', async () => {
    render(NumericSteppers, {
      props: {
        modelValue: 999,
        max: 999,
      },
    })

    // Both increment buttons should be disabled
    const incrementSmall = page.getByRole('button', { name: /increment by 1/i })
    const incrementLarge = page.getByRole('button', { name: /increment by 5/i })

    await expect.element(incrementSmall).toBeDisabled()
    await expect.element(incrementLarge).toBeDisabled()
  })

  it('clamps value to min on decrement', async () => {
    const onUpdate = vi.fn()
    render(NumericSteppers, {
      props: {
        modelValue: 2,
        min: 0,
        largeStep: 5,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Large decrement would go to -3, but should clamp to 0
    await userEvent.click(page.getByRole('button', { name: /decrement by 5/i }))

    expect(onUpdate).toHaveBeenCalledWith(0)
  })

  it('clamps value to max on increment', async () => {
    const onUpdate = vi.fn()
    render(NumericSteppers, {
      props: {
        modelValue: 997,
        max: 999,
        largeStep: 5,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Large increment would go to 1002, but should clamp to 999
    await userEvent.click(page.getByRole('button', { name: /increment by 5/i }))

    expect(onUpdate).toHaveBeenCalledWith(999)
  })

  it('uses custom step sizes', async () => {
    const onUpdate = vi.fn()
    render(NumericSteppers, {
      props: {
        modelValue: 20,
        smallStep: 2.5,
        largeStep: 10,
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Click small increment with custom step
    await userEvent.click(page.getByRole('button', { name: /increment by 2\.5/i }))

    expect(onUpdate).toHaveBeenCalledWith(22.5)
  })
})
