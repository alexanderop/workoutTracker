import type { Router } from 'vue-router'
import { render, screen, waitFor, cleanup as rtlCleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import { routes } from '@/router'
import { useExercisesStore } from '@/stores/exercises'

type CreateTestAppOptions = {
  initialRoute?: string
}

type SetInputs = {
  kg: HTMLInputElement
  reps: HTMLInputElement
  rir: HTMLInputElement
  complete: HTMLElement
}

type SetValues = {
  kg?: number
  reps?: number
  rir?: number
}

type TestApp = {
  router: Router
  user: ReturnType<typeof userEvent.setup>
  getByRole: typeof screen.getByRole
  getByText: typeof screen.getByText
  getByTestId: typeof screen.getByTestId
  queryByRole: typeof screen.queryByRole
  queryByText: typeof screen.queryByText
  findByRole: typeof screen.findByRole
  findByText: typeof screen.findByText
  navigateTo: (path: string) => Promise<void>
  waitForDialog: () => Promise<HTMLElement>
  waitForRoute: (pathPattern: RegExp) => Promise<void>
  getDialogButton: (text: string) => HTMLElement
  assertDialogClosed: () => void
  getCarouselExerciseButtons: () => ReadonlyArray<HTMLElement>
  getPlaylistBlockButtons: () => ReadonlyArray<HTMLElement>
  getSetRow: (setIndex: number) => SetInputs
  fillSet: (setIndex: number, values: SetValues) => Promise<void>
  startWorkout: () => Promise<void>
  openWorkoutMenu: () => Promise<void>
  cleanup: () => void
}

export async function createTestApp(options: CreateTestAppOptions = {}): Promise<TestApp> {
  const { initialRoute = '/' } = options

  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  if (initialRoute !== '/') {
    router.push(initialRoute)
  }

  const user = userEvent.setup()

  render(App, {
    global: {
      plugins: [router, pinia],
    },
  })

  await router.isReady()

  // Flush Vue's async operations to ensure onMounted fires
  await flushPromises()

  // Wait for app initialization to complete (exercises seeding and loading)
  const exercisesStore = useExercisesStore(pinia)
  await waitFor(
    () => {
      if (exercisesStore.customExercises.length === 0) {
        throw new Error('Exercises not loaded yet')
      }
    },
    { timeout: 5000 },
  )

  async function navigateTo(path: string) {
    await router.push(path)
  }

  async function waitForDialog(): Promise<HTMLElement> {
    return await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      return dialog
    })
  }

  async function waitForRoute(pathPattern: RegExp): Promise<void> {
    await waitFor(() => {
      const currentPath = router.currentRoute.value.path
      if (!pathPattern.test(currentPath)) {
        throw new Error(`Expected route to match ${pathPattern}, got ${currentPath}`)
      }
    })
  }

  function getDialogButton(text: string): HTMLElement {
    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button')
    const btn = Array.from(buttons).find((b) => b.textContent?.includes(text))
    if (!btn) {
      throw new Error(`Dialog button with text "${text}" not found`)
    }
    return btn
  }

  function assertDialogClosed() {
    const dialog = screen.queryByRole('dialog')
    if (dialog) {
      throw new Error('Expected dialog to be closed but it is still open')
    }
  }

  function getCarouselExerciseButtons(): ReadonlyArray<HTMLElement> {
    // Get all exercise buttons in the carousel (exclude the "Add exercise" button)
    // In the new UI, these are playlist items with role="button" and aria-pressed
    const allButtons = screen.getAllByRole('button')
    return allButtons.filter(
      (btn) =>
        btn.getAttribute('aria-pressed') !== null &&
        btn.getAttribute('aria-label') !== 'Add exercise',
    )
  }

  function getPlaylistBlockButtons(): ReadonlyArray<HTMLElement> {
    // Get all block buttons in the playlist (role="button" with aria-pressed)
    const allButtons = screen.getAllByRole('button')
    return allButtons.filter((btn) => btn.getAttribute('aria-pressed') !== null)
  }

  async function startWorkout(): Promise<void> {
    // Click "Start Workout" button to transition from builder to active mode
    await user.click(screen.getByRole('button', { name: /start workout/i }))
  }

  async function openWorkoutMenu(): Promise<void> {
    // Open the dropdown menu in active mode header (three-dot/more icon)
    // The menu button is a ghost button with MoreVertical icon
    const buttons = screen.getAllByRole('button')
    const menuButton = buttons.find((btn) => {
      // Find the button that contains the MoreVertical SVG
      const svg = btn.querySelector('svg.lucide-more-vertical')
      return svg !== null
    })
    if (!menuButton) {
      throw new Error('Workout menu button not found')
    }
    await user.click(menuButton)
  }

  function getSetRow(setIndex: number): SetInputs {
    // Get table rows and find the row at the specified index
    const rows = document.querySelectorAll('tbody tr')
    const row = rows[setIndex]
    if (!row) {
      throw new Error(`Set row at index ${setIndex} not found`)
    }

    // Get all spinbuttons (NumberFieldInput) in the row - they appear in order: kg, reps, rir
    const spinbuttons = row.querySelectorAll('[role="spinbutton"]')
    if (spinbuttons.length < 3) {
      throw new Error(`Expected 3 spinbuttons in set row, found ${spinbuttons.length}`)
    }

    const kg = spinbuttons[0]
    const reps = spinbuttons[1]
    const rir = spinbuttons[2]

    if (
      !(kg instanceof HTMLInputElement) ||
      !(reps instanceof HTMLInputElement) ||
      !(rir instanceof HTMLInputElement)
    ) {
      throw new Error('Spinbutton elements are not HTMLInputElements')
    }

    // Get the complete button (first button with an SVG icon in the complete column)
    const completeButton = row.querySelector('button:has(svg.lucide-check)')
    if (!(completeButton instanceof HTMLElement)) {
      throw new Error('Complete button not found in set row')
    }

    return {
      kg,
      reps,
      rir,
      complete: completeButton,
    }
  }

  async function fillSet(setIndex: number, values: SetValues): Promise<void> {
    const inputs = getSetRow(setIndex)

    if (values.kg !== undefined) {
      await user.clear(inputs.kg)
      await user.type(inputs.kg, String(values.kg))
    }
    if (values.reps !== undefined) {
      await user.clear(inputs.reps)
      await user.type(inputs.reps, String(values.reps))
    }
    if (values.rir !== undefined) {
      await user.clear(inputs.rir)
      await user.type(inputs.rir, String(values.rir))
    }
  }

  function cleanup() {
    rtlCleanup()
  }

  return {
    router,
    user,
    getByRole: screen.getByRole,
    getByText: screen.getByText,
    getByTestId: screen.getByTestId,
    queryByRole: screen.queryByRole,
    queryByText: screen.queryByText,
    findByRole: screen.findByRole,
    findByText: screen.findByText,
    navigateTo,
    waitForDialog,
    waitForRoute,
    getDialogButton,
    assertDialogClosed,
    getCarouselExerciseButtons,
    getPlaylistBlockButtons,
    getSetRow,
    fillSet,
    startWorkout,
    openWorkoutMenu,
    cleanup,
  }
}
