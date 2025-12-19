import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { App } from 'vue'
import { createApp } from 'vue'
import { RouteNames, routes } from '@/router'

const mockUpdateServiceWorker = vi.fn()
const mockNeedRefresh = ref(false)

vi.mock('virtual:pwa-register/vue', () => ({
  useRegisterSW: () => ({
    needRefresh: mockNeedRefresh,
    updateServiceWorker: mockUpdateServiceWorker,
  }),
}))

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes,
  })
}

function withRouterSetup<TResult>(
  composable: () => TResult,
  router: ReturnType<typeof createTestRouter>,
): [TResult, App] {
  let result!: TResult
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    },
  })
  app.use(router)
  app.mount(document.createElement('div'))
  return [result, app]
}

describe('usePwaUpdate', () => {
  let router: ReturnType<typeof createTestRouter>
  let app: App

  async function setupPwaUpdate() {
    const { usePwaUpdate } = await import('@/composables/usePwaUpdate')
    const [, testApp] = withRouterSetup(() => usePwaUpdate(), router)
    app = testApp
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    mockNeedRefresh.value = false
    router = createTestRouter()
    await router.push({ name: RouteNames.Home })
    await router.isReady()
  })

  afterEach(() => {
    app?.unmount()
  })

  it('does NOT call updateServiceWorker when needRefresh is false', async () => {
    await setupPwaUpdate()

    mockNeedRefresh.value = false
    await router.push({ name: RouteNames.Settings })

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
  })

  it('calls updateServiceWorker on route change when needRefresh is true', async () => {
    await setupPwaUpdate()

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.Settings })

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('does NOT call updateServiceWorker when navigating TO ActiveWorkout', async () => {
    await setupPwaUpdate()

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.ActiveWorkout })

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
  })

  it('does NOT call updateServiceWorker when navigating TO ActiveBenchmark', async () => {
    await setupPwaUpdate()

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.ActiveBenchmark })

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
  })

  it('calls updateServiceWorker when navigating AWAY from ActiveWorkout', async () => {
    const { usePwaUpdate } = await import('@/composables/usePwaUpdate')

    await router.push({ name: RouteNames.ActiveWorkout })

    const [, testApp] = withRouterSetup(() => usePwaUpdate(), router)
    app = testApp

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.Home })

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
  })
})
