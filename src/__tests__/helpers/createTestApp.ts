import type { RouteLocationRaw, Router } from 'vue-router'
import { render, screen, waitFor, cleanup as rtlCleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import { routes } from '@/router'
import { useExercisesStore } from '@/stores/exercises'
import { i18n } from '@/i18n'
import en from '@/i18n/messages/en'
import { CommonPO, BuilderPO, ActiveWorkoutPO, QueuePO } from './pages'

type CreateTestAppOptions = {
  initialRoute?: string
}

type TestApp = {
  router: Router
  user: ReturnType<typeof userEvent.setup>
  // Page Objects
  common: CommonPO
  builder: BuilderPO
  workout: ActiveWorkoutPO
  queue: QueuePO
  // Raw query methods
  getByRole: typeof screen.getByRole
  getByText: typeof screen.getByText
  getByTestId: typeof screen.getByTestId
  queryByRole: typeof screen.queryByRole
  queryByText: typeof screen.queryByText
  findByRole: typeof screen.findByRole
  findByText: typeof screen.findByText
  // Helpers
  navigateTo: (to: RouteLocationRaw) => Promise<void>
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

  // Preload English messages for tests
  i18n.global.setLocaleMessage('en', en)
  i18n.global.locale.value = 'en'

  render(App, {
    global: {
      plugins: [router, pinia, i18n],
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

  // Create context for page objects
  const context = { router, user }

  // Instantiate page objects
  const common = new CommonPO(context)
  const builder = new BuilderPO(context, common)
  const workout = new ActiveWorkoutPO(context, common)
  const queue = new QueuePO(context, common)

  // Simple navigation helper
  async function navigateTo(to: RouteLocationRaw) {
    await router.push(to)
  }

  function cleanup() {
    rtlCleanup()
  }

  return {
    router,
    user,
    // Page Objects
    common,
    builder,
    workout,
    queue,
    // Raw query methods
    getByRole: screen.getByRole,
    getByText: screen.getByText,
    getByTestId: screen.getByTestId,
    queryByRole: screen.queryByRole,
    queryByText: screen.queryByText,
    findByRole: screen.findByRole,
    findByText: screen.findByText,
    // Helpers
    navigateTo,
    cleanup,
  }
}
