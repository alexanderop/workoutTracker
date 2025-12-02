import { waitFor } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

// Helper to find timer type button by its label text
function findTimerTypeButton(label: 'AMRAP' | 'EMOM' | 'Tabata' | 'For Time'): HTMLElement {
  const buttons = [...document.querySelectorAll('button')]
  for (const btn of buttons) {
    if (btn.textContent?.includes(label) && btn instanceof HTMLElement) {
      return btn
    }
  }
  throw new Error(`Timer type button "${label}" not found`)
}

// Helper to find preset button by text
function findPresetButton(text: string): HTMLElement {
  const buttons = [...document.querySelectorAll('button')]
  for (const btn of buttons) {
    if (btn.textContent?.toLowerCase().includes(text.toLowerCase()) && btn instanceof HTMLElement) {
      return btn
    }
  }
  throw new Error(`Preset button containing "${text}" not found`)
}

// Helper to find control buttons by their SVG icon class
function findControlButton(iconName: 'x' | 'play' | 'pause' | 'rotate-ccw'): HTMLElement {
  const svgClass = `lucide-${iconName}`
  const buttons = [...document.querySelectorAll('button')]
  for (const btn of buttons) {
    if (btn.querySelector(`svg.${svgClass}`) && btn instanceof HTMLElement) {
      return btn
    }
  }
  throw new Error(`Control button with icon ${iconName} not found`)
}

// Helper to find the back button with arrow-left icon
function findBackButton(): HTMLElement {
  const buttons = [...document.querySelectorAll('button')]
  for (const btn of buttons) {
    if (btn.querySelector('svg.lucide-arrow-left') && btn instanceof HTMLElement) {
      return btn
    }
  }
  throw new Error('Back button with arrow-left icon not found')
}

// Helper to navigate to timers page from home
async function goToTimersPage(app: Awaited<ReturnType<typeof createTestApp>>) {
  const quickTimerCard = app.getByText(/quick timer/i)
  await app.user.click(quickTimerCard)
  await waitFor(() => {
    expect(app.queryByText(/AMRAP/)).toBeTruthy()
  })
}

describe('Standalone Timers Flow', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  it('navigates from home to timers page via Quick Timer card', async () => {
    const app = await createTestApp()

    // Find and click the Quick Timer card on home page
    const quickTimerCard = app.getByText(/quick timer/i)
    expect(quickTimerCard).toBeTruthy()

    await app.user.click(quickTimerCard)

    // Verify navigation to timers page
    expect(app.router.currentRoute.value.path).toBe('/timers')

    // Verify timer selection UI is shown
    await waitFor(() => {
      expect(app.queryByText(/AMRAP/)).toBeTruthy()
    })
    expect(app.queryByText(/EMOM/)).toBeTruthy()
    expect(app.queryByText(/Tabata/)).toBeTruthy()
    expect(app.queryByText(/For Time/)).toBeTruthy()

    app.cleanup()
  })

  it('displays all four timer type options on timers page', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Verify all timer types are shown with descriptions
    expect(app.queryByText(/As Many Rounds As Possible/)).toBeTruthy()

    expect(app.queryByText(/EMOM/)).toBeTruthy()
    expect(app.queryByText(/Every Minute On the Minute/)).toBeTruthy()

    expect(app.queryByText(/Tabata/)).toBeTruthy()
    expect(app.queryByText(/Work\/Rest Intervals/)).toBeTruthy()

    expect(app.queryByText(/For Time/)).toBeTruthy()
    expect(app.queryByText(/Race Against the Clock/)).toBeTruthy()

    app.cleanup()
  })

  it('shows AMRAP presets when selecting AMRAP timer', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Click AMRAP button
    await app.user.click(findTimerTypeButton('AMRAP'))

    // Verify presets are shown - use exact text to avoid matching "15 min"
    await waitFor(() => {
      expect(app.queryByText('5 min')).toBeTruthy()
    })
    expect(app.queryByText('10 min')).toBeTruthy()
    expect(app.queryByText('15 min')).toBeTruthy()
    expect(app.queryByText('20 min')).toBeTruthy()
    expect(app.queryByText(/Custom/)).toBeTruthy()

    app.cleanup()
  })

  it('shows Tabata presets including Nordic protocol', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Click Tabata button
    await app.user.click(findTimerTypeButton('Tabata'))

    // Verify presets are shown
    await waitFor(() => {
      expect(app.queryByText(/Classic/)).toBeTruthy()
    })
    expect(app.queryByText(/8×20\/10/)).toBeTruthy()
    expect(app.queryByText(/Long/)).toBeTruthy()
    expect(app.queryByText(/Short/)).toBeTruthy()
    expect(app.queryByText(/Nordic/)).toBeTruthy()
    expect(app.queryByText(/4×4min\/3min/)).toBeTruthy()

    app.cleanup()
  })

  it('starts AMRAP timer from preset and shows timer UI with controls', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select AMRAP
    await app.user.click(findTimerTypeButton('AMRAP'))

    // Wait for presets and select 5 min preset
    await waitFor(() => {
      expect(app.queryByText('5 min')).toBeTruthy()
    })
    await app.user.click(findPresetButton('Quick burst')) // Use description to be more specific

    // Verify timer runner is shown with controls
    await waitFor(() => {
      // Play button should be visible (timer not started yet)
      const playButtons = document.querySelectorAll('svg.lucide-play')
      expect(playButtons.length).toBeGreaterThan(0)
    })

    // Verify rounds display exists
    expect(app.queryByText(/Rounds/)).toBeTruthy()

    // Verify exit button (X) exists
    const closeButtons = document.querySelectorAll('svg.lucide-x')
    expect(closeButtons.length).toBeGreaterThan(0)

    // Verify reset button exists
    const resetButtons = document.querySelectorAll('svg.lucide-rotate-ccw')
    expect(resetButtons.length).toBeGreaterThan(0)

    app.cleanup()
  })

  it('allows navigating back from preset selection to timer selection', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select EMOM
    await app.user.click(findTimerTypeButton('EMOM'))

    // Wait for presets
    await waitFor(() => {
      expect(app.queryByText('10 min')).toBeTruthy()
    })

    // Click back button (arrow-left icon)
    await app.user.click(findBackButton())

    // Should be back at timer selection
    await waitFor(() => {
      expect(app.queryByText(/As Many Rounds As Possible/)).toBeTruthy()
    })

    app.cleanup()
  })

  it('shows custom configuration form for Tabata', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select Tabata
    await app.user.click(findTimerTypeButton('Tabata'))

    // Wait for presets and click Custom
    await waitFor(() => {
      expect(app.queryByText(/Custom/)).toBeTruthy()
    })
    await app.user.click(findPresetButton('Custom'))

    // Verify custom form fields appear
    await waitFor(() => {
      expect(app.queryByText(/Rounds/)).toBeTruthy()
    })
    expect(app.queryByText(/Work \(seconds\)/)).toBeTruthy()
    expect(app.queryByText(/Rest \(seconds\)/)).toBeTruthy()

    // Verify Start button in form
    expect(app.queryByRole('button', { name: /Start/ })).toBeTruthy()

    app.cleanup()
  })

  it('shows For Time presets including No cap option', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Click For Time button
    await app.user.click(findTimerTypeButton('For Time'))

    // Verify presets are shown
    await waitFor(() => {
      expect(app.queryByText('10 min cap')).toBeTruthy()
    })
    expect(app.queryByText('15 min cap')).toBeTruthy()
    expect(app.queryByText('20 min cap')).toBeTruthy()
    expect(app.queryByText('No cap')).toBeTruthy()

    app.cleanup()
  })

  it('exits timer and returns to timer selection', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select AMRAP and start 5 min preset
    await app.user.click(findTimerTypeButton('AMRAP'))
    await waitFor(() => {
      expect(app.queryByText('5 min')).toBeTruthy()
    })
    await app.user.click(findPresetButton('Quick burst'))

    // Wait for timer UI
    await waitFor(() => {
      const closeButtons = document.querySelectorAll('svg.lucide-x')
      expect(closeButtons.length).toBeGreaterThan(0)
    })

    // Find and click exit button
    await app.user.click(findControlButton('x'))

    // Should return to timer selection
    await waitFor(() => {
      expect(app.queryByText(/As Many Rounds As Possible/)).toBeTruthy()
    })

    app.cleanup()
  })

  it('starts EMOM timer and shows minute display', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select EMOM
    await app.user.click(findTimerTypeButton('EMOM'))

    // Select 10 min preset
    await waitFor(() => {
      expect(app.queryByText('10 min')).toBeTruthy()
    })
    await app.user.click(findPresetButton('Quick session'))

    // Verify timer UI is shown with minute display (uppercase)
    await waitFor(() => {
      expect(app.queryByText(/MINUTE 1 OF 10/)).toBeTruthy()
    })

    app.cleanup()
  })
})
