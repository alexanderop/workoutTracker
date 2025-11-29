import type { Router } from 'vue-router'
import { render, screen, waitFor, cleanup as rtlCleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import { routes } from '@/router'

type CreateTestAppOptions = {
  initialRoute?: string
}

type TestApp = {
  router: Router
  user: ReturnType<typeof userEvent.setup>
  getByRole: typeof screen.getByRole
  getByText: typeof screen.getByText
  queryByRole: typeof screen.queryByRole
  queryByText: typeof screen.queryByText
  findByRole: typeof screen.findByRole
  findByText: typeof screen.findByText
  navigateTo: (path: string) => Promise<void>
  waitForDialog: () => Promise<HTMLElement>
  getDialogButton: (text: string) => HTMLElement
  assertDialogClosed: () => void
  getCarouselExerciseButtons: () => ReadonlyArray<HTMLElement>
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

  async function navigateTo(path: string) {
    await router.push(path)
  }

  async function waitForDialog(): Promise<HTMLElement> {
    return await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      return dialog
    })
  }

  function getDialogButton(text: string): HTMLElement {
    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button')
    const btn = Array.from(buttons).find(b => b.textContent?.includes(text))
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
    const allButtons = screen.getAllByRole('button')
    return allButtons.filter(btn =>
      btn.getAttribute('aria-pressed') !== null
      && btn.getAttribute('aria-label') !== 'Add exercise',
    )
  }

  function cleanup() {
    rtlCleanup()
  }

  return {
    router,
    user,
    getByRole: screen.getByRole,
    getByText: screen.getByText,
    queryByRole: screen.queryByRole,
    queryByText: screen.queryByText,
    findByRole: screen.findByRole,
    findByText: screen.findByText,
    navigateTo,
    waitForDialog,
    getDialogButton,
    assertDialogClosed,
    getCarouselExerciseButtons,
    cleanup,
  }
}
