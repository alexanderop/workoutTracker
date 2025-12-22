import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import { flushPromises } from '@vue/test-utils'
import NumericWheelPicker from '@/components/ui/numeric-input/NumericWheelPicker.vue'

describe('NumericWheelPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders values centered around model value', async () => {
    render(NumericWheelPicker, {
      props: {
        modelValue: 20,
        type: 'weight',
      },
    })

    // Should contain the current value
    await expect.element(page.getByText('20')).toBeVisible()

    // Should show values around it
    await expect.element(page.getByText('17.5')).toBeInTheDocument()
    await expect.element(page.getByText('22.5')).toBeInTheDocument()
  })

  it('highlights the selected value', async () => {
    render(NumericWheelPicker, {
      props: {
        modelValue: 20,
        type: 'weight',
      },
    })

    // The selected value should have special styling
    const selectedItem = page.getByTestId('wheel-item-selected')
    await expect.element(selectedItem).toBeVisible()
    await expect.element(selectedItem).toHaveTextContent('20')
  })

  it('scrolls to value when clicking on it', async () => {
    const onUpdate = vi.fn()
    render(NumericWheelPicker, {
      props: {
        modelValue: 20,
        type: 'weight',
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Click on a different value
    const value25 = page.getByTestId('wheel-item-25')
    await userEvent.click(value25)

    // Should scroll and emit update
    vi.advanceTimersByTime(300) // Wait for scroll debounce
    await flushPromises()

    expect(onUpdate).toHaveBeenCalledWith(25)
  })

  it('shows unit suffix for weight type', async () => {
    render(NumericWheelPicker, {
      props: {
        modelValue: 20,
        type: 'weight',
        unit: 'kg',
      },
    })

    // Should display unit
    await expect.element(page.getByText(/20.*kg/)).toBeVisible()
  })

  it('uses integer steps for reps type', async () => {
    render(NumericWheelPicker, {
      props: {
        modelValue: 10,
        type: 'reps',
      },
    })

    // Should show integers - use testid for precise selection
    await expect.element(page.getByTestId('wheel-item-9')).toBeInTheDocument()
    await expect.element(page.getByTestId('wheel-item-selected')).toHaveTextContent('10')
    await expect.element(page.getByTestId('wheel-item-11')).toBeInTheDocument()

    // Should NOT have decimals
    const decimalItem = page.getByTestId('wheel-item-9.5')
    await expect.element(decimalItem).not.toBeInTheDocument()
  })

  it('constrains rir values to 0-10', async () => {
    render(NumericWheelPicker, {
      props: {
        modelValue: 5,
        type: 'rir',
      },
    })

    // Should show valid rir values - use testid for precise selection
    await expect.element(page.getByTestId('wheel-item-0')).toBeInTheDocument()
    await expect.element(page.getByTestId('wheel-item-selected')).toHaveTextContent('5')
    await expect.element(page.getByTestId('wheel-item-10')).toBeInTheDocument()

    // Should NOT show values outside range
    const value11 = page.getByTestId('wheel-item-11')
    await expect.element(value11).not.toBeInTheDocument()
  })

  it('generates values respecting min of 0 for weight', async () => {
    render(NumericWheelPicker, {
      props: {
        modelValue: 5,
        type: 'weight',
      },
    })

    // Should have 0 as minimum - use testid
    await expect.element(page.getByTestId('wheel-item-0')).toBeInTheDocument()

    // Should NOT have negative values
    const negativeValue = page.getByTestId('wheel-item--2.5')
    await expect.element(negativeValue).not.toBeInTheDocument()
  })

  it('emits update when scroll settles on new value', async () => {
    const onUpdate = vi.fn()
    const { container } = render(NumericWheelPicker, {
      props: {
        modelValue: 20,
        type: 'weight',
        'onUpdate:modelValue': onUpdate,
      },
    })

    // Simulate scroll
    const wheelContainer = container.querySelector('[data-testid="wheel-container"]')
    if (wheelContainer) {
      wheelContainer.scrollTop = 200
      wheelContainer.dispatchEvent(new Event('scroll'))
    }

    // Wait for debounce
    vi.advanceTimersByTime(150)
    await flushPromises()

    // Should have emitted update (value depends on scroll position)
    expect(onUpdate).toHaveBeenCalled()
  })
})
