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

  it('shows cancel button and confirm button', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
      },
    })

    await expect
      .element(page.getByRole('button', { name: /cancel/i }))
      .toBeVisible()
    await expect
      .element(page.getByRole('button', { name: /confirm value/i }))
      .toBeVisible()
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

  it('contains preset list, value display, and keypad', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'weight',
      },
    })

    // Preset list (check for a preset button)
    await expect
      .element(page.getByRole('option', { selected: true }))
      .toBeVisible()

    // Value display (uses role="status" with aria-label)
    await expect
      .element(page.getByRole('status', { name: /current value/i }))
      .toBeVisible()

    // Keypad (digit buttons)
    await expect
      .element(page.getByRole('button', { name: '5', exact: true }))
      .toBeVisible()
  })

  it('syncs value between preset selection and keypad', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 20,
        type: 'reps',
      },
    })

    const valueDisplay = page.getByRole('status', { name: /current value/i })

    // Initial value shown in display
    await expect.element(valueDisplay).toHaveTextContent('20')

    // Change via keypad - first press replaces due to fresh-start mode (calculator-style)
    await userEvent.click(page.getByRole('button', { name: '5', exact: true }))

    // Display should update (5 replaces 20)
    await expect.element(valueDisplay).toHaveTextContent('5')

    // Second press appends
    await userEvent.click(page.getByRole('button', { name: '0', exact: true }))
    await expect.element(valueDisplay).toHaveTextContent('50')
  })

  it('instantly applies and closes when preset is clicked', async () => {
    const onUpdate = vi.fn()
    const onOpenChange = vi.fn()

    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 10,
        type: 'reps',
        'onUpdate:modelValue': onUpdate,
        'onUpdate:open': onOpenChange,
      },
    })

    // Click a different preset
    await userEvent.click(page.getByRole('option', { name: /^11\b/ }))

    // Should instantly apply and close
    expect(onUpdate).toHaveBeenCalledWith(11)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('emits update and closes on Confirm click', async () => {
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

    // Modify value using keypad (fresh-start mode replaces, then append)
    await userEvent.click(page.getByRole('button', { name: '5', exact: true })) // 20 → 5
    await userEvent.click(page.getByRole('button', { name: '0', exact: true })) // 5 → 50

    // Click Confirm
    await userEvent.click(page.getByRole('button', { name: /confirm value/i }))

    expect(onUpdate).toHaveBeenCalledWith(50)
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

    // Modify value using keypad
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

    // Weight preset should show decimal values
    await expect.element(page.getByRole('option', { name: /22\.5/ })).toBeInTheDocument()
  })

  it('uses smart presets for reps type', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 10,
        type: 'reps',
      },
    })

    // Reps preset should show integer values only
    await expect.element(page.getByRole('option', { name: /^11\b/ })).toBeInTheDocument()
  })

  it('uses smart presets for rir type', async () => {
    render(NumericInputModal, {
      props: {
        open: true,
        modelValue: 5,
        type: 'rir',
      },
    })

    // RIR max is 10
    await expect.element(page.getByRole('option', { name: /^10\b/ })).toBeInTheDocument()
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

    // Check that the selected preset shows the unit
    await expect
      .element(page.getByRole('option', { selected: true }).getByText('kg'))
      .toBeVisible()
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
