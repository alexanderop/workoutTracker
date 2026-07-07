import type { RouteLocationRaw, Router } from 'vue-router'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { expect } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { useExercisesStore } from '@/stores/exercises'
import { i18n } from '@/i18n'
import en from '@/i18n/messages/en'
import {
  CommonPO,
  BuilderPO,
  ActiveWorkoutPO,
  QueuePO,
  BenchmarksPO,
  BenchmarkFormPO,
  BenchmarkDetailPO,
  LogPastWorkoutPO,
  ExercisesPO,
  WeightPO,
  ProgressionsPO,
} from './pages'

type CreateTestAppOptions = {
  initialRoute?: string
}

type TestApp = {
  router: Router
  container: Element
  // Page Objects
  common: CommonPO
  builder: BuilderPO
  workout: ActiveWorkoutPO
  queue: QueuePO
  benchmarks: BenchmarksPO
  benchmarkForm: BenchmarkFormPO
  benchmarkDetail: BenchmarkDetailPO
  logPastWorkout: LogPastWorkoutPO
  exercises: ExercisesPO
  weight: WeightPO
  progressions: ProgressionsPO
  // Raw query methods (use page.getBy* for new code)
  getByRole: typeof page.getByRole
  getByText: typeof page.getByText
  getByTestId: typeof page.getByTestId
  queryByRole: typeof page.getByRole
  queryByText: typeof page.getByText
  findByRole: typeof page.getByRole
  findByText: typeof page.getByText
  // Helpers
  navigateTo: (to: RouteLocationRaw) => Promise<void>
  cleanup: () => void
}

export async function createTestApp(options: CreateTestAppOptions = {}): Promise<TestApp> {
  const { initialRoute = '/' } = options

  // Same factory as production (routes, document titles, onboarding guard) --
  // only the history implementation differs.
  const router = createAppRouter(createMemoryHistory())

  if (initialRoute !== '/') {
    router.push(initialRoute)
  }

  // Preload English messages for tests
  i18n.global.setLocaleMessage('en', en)
  i18n.global.locale.value = 'en'

  const screen = render(App, {
    global: {
      plugins: [router, i18n],
    },
  })

  await router.isReady()

  // Flush Vue's async operations to ensure onMounted fires
  await flushPromises()

  // Wait for app initialization to complete (exercises seeding and loading)
  const exercisesStore = useExercisesStore()
  await expect
    .poll(() => exercisesStore.customExercises.length, { timeout: 5000 })
    .toBeGreaterThan(0)

  // Create context for page objects
  const context = { router }

  // Instantiate page objects
  const common = new CommonPO(context)
  const builder = new BuilderPO(common)
  const workout = new ActiveWorkoutPO(common)
  const queue = new QueuePO(common)
  const benchmarks = new BenchmarksPO(common)
  const benchmarkForm = new BenchmarkFormPO(common)
  const benchmarkDetail = new BenchmarkDetailPO(context)
  const logPastWorkout = new LogPastWorkoutPO(common)
  const exercises = new ExercisesPO(common)
  const weight = new WeightPO(common)
  const progressions = new ProgressionsPO(common)

  // Navigation helper with flush to ensure route renders
  async function navigateTo(to: RouteLocationRaw) {
    await router.push(to)
    await flushPromises()
  }

  // vitest-browser-vue cleans up before tests automatically
  // This is kept for backward compatibility with test structure
  function cleanup() {
    screen.unmount()
  }

  return {
    router,
    container: screen.container,
    // Page Objects
    common,
    builder,
    workout,
    queue,
    benchmarks,
    benchmarkForm,
    benchmarkDetail,
    logPastWorkout,
    exercises,
    weight,
    progressions,
    // Raw query methods - use page locators (return Locators, not HTMLElements)
    getByRole: page.getByRole.bind(page),
    getByText: page.getByText.bind(page),
    getByTestId: page.getByTestId.bind(page),
    queryByRole: page.getByRole.bind(page),
    queryByText: page.getByText.bind(page),
    findByRole: page.getByRole.bind(page),
    findByText: page.getByText.bind(page),
    // Helpers
    navigateTo,
    cleanup,
  }
}
