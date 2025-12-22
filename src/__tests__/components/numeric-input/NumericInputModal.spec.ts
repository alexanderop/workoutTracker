import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import NumericInputModal from '@/components/ui/numeric-input/NumericInputModal.vue'

describe('NumericInputModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders as fullscreen dialog when open', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
      },
    })

    await expect.element(page.getByRole('dialog')).toBeVisible()
  })

  it('does not render when closed', async () => {
    render(NumericInputModal, {
      props: {
        open: false,
        modelValue: 20,
        type: 'weight',
      },
    })

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows cancel and done buttons', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
      },
    })

    await expect.element(page.getByRole('button', { name: /cancel/i })).toBeVisible()
    await expect.element(page.getByRole('button', { name: /done/i })).toBeVisible()
  })

  it('shows title based on type', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
      },
    })

    await expect.element(page.getByText(/weight/i)).toBeVisible()
  })

  it('contains wheel picker, steppers, and keypad', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
      },
    })

    // Wheel picker
    await expect.element(page.getByTestId('wheel-container')).toBeVisible()

    // Steppers
    await expect.element(page.getByTestId('stepper-display')).toBeVisible()

    // Keypad
    await expect.element(page.getByTestId('keypad-display')).toBeVisible()
  })

  it('syncs value across wheel, steppers, and keypad', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'reps',
      },
    })

    // Initial value shown in all displays
    await expect.element(page.getByTestId('stepper-display')).toHaveTextContent('20')
    await expect.element(page.getByTestId('keypad-display')).toHaveTextContent('20')

    // Change via keypad - click "5" to make it 205 (use exact match)
    await userEvent.click(page.getByRole('button', { name: '5', exact: true }))

    // All displays should update
    await expect.element(page.getByTestId('stepper-display')).toHaveTextContent('205')
    await expect.element(page.getByTestId('keypad-display')).toHaveTextContent('205')
  })

  it('emits update and closes on Done click', async () => {
    const onUpdate = vi.fn()
    const onOpenChange = vi.fn()

    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
        'onUpdate:modelValue': onUpdate,
        'onUpdate:open': onOpenChange,
      },
    })

    // Modify value using keypad - use exact match to avoid stepper buttons
    await userEvent.click(page.getByRole('button', { name: '5', exact: true }))

    // Click Done
    await userEvent.click(page.getByRole('button', { name: /done/i }))

    expect(onUpdate).toHaveBeenCalledWith(205)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not emit update on Cancel click', async () => {
    const onUpdate = vi.fn()
    const onOpenChange = vi.fn()

    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
        'onUpdate:modelValue': onUpdate,
        'onUpdate:open': onOpenChange,
      },
    })

    // Modify value using keypad - use exact match
    await userEvent.click(page.getByRole('button', { name: '5', exact: true }))

    // Click Cancel
    await userEvent.click(page.getByRole('button', { name: /cancel/i }))

    expect(onUpdate).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses smart presets for weight type', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
      },
    })

    // Weight should allow decimals - decimal button visible in keypad (exact match)
    await expect.element(page.getByRole('button', { name: '.', exact: true })).toBeVisible()

    // Weight wheel should show decimal values
    await expect.element(page.getByTestId('wheel-item-22.5')).toBeInTheDocument()
  })

  it('uses smart presets for reps type', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 10,
        type: 'reps',
      },
    })

    // Reps should NOT allow decimals - decimal button hidden (exact match)
    await expect.element(page.getByRole('button', { name: '.', exact: true })).not.toBeInTheDocument()
  })

  it('uses smart presets for rir type', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 5,
        type: 'rir',
      },
    })

    // RIR should NOT allow decimals (exact match)
    await expect.element(page.getByRole('button', { name: '.', exact: true })).not.toBeInTheDocument()

    // RIR max is 10
    await expect.element(page.getByTestId('wheel-item-10')).toBeInTheDocument()
  })

  it('shows unit label for weight', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
        unit: 'kg',
      },
    })

    await expect.element(page.getByText(/kg/)).toBeVisible()
  })

  it('closes on Escape key', async () => {
    const onOpenChange = vi.fn()

    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
        'onUpdate:open': onOpenChange,
      },
    })

    await userEvent.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
