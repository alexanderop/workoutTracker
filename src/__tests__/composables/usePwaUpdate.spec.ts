import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, it, expect, vi } from 'vitest'
import type { App } from 'vue'
import { createApp } from 'vue'
import { RouteNames, routes, type RouteName } from '@/router'

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

interface SetupOptions {
  startRoute?: RouteName
}

async function setupPwaUpdate(options: SetupOptions = {}) {
  vi.clearAllMocks()
  mockNeedRefresh.value = false

  const router = createTestRouter()
  await router.push({ name: options.startRoute ?? RouteNames.Home })
  await router.isReady()

  const { usePwaUpdate } = await import('@/composables/usePwaUpdate')
  const [, app] = withRouterSetup(() => usePwaUpdate(), router)

  return {
    router,
    app,
    cleanup: () => app.unmount(),
  }
}

describe('usePwaUpdate', () => {
  it('does NOT call updateServiceWorker when needRefresh is false', async () => {
    const { router, cleanup } = await setupPwaUpdate()

    mockNeedRefresh.value = false
    await router.push({ name: RouteNames.Settings })

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
    cleanup()
  })

  it('calls updateServiceWorker on route change when needRefresh is true', async () => {
    const { router, cleanup } = await setupPwaUpdate()

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.Settings })

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
    cleanup()
  })

  it('does NOT call updateServiceWorker when navigating TO ActiveWorkout', async () => {
    const { router, cleanup } = await setupPwaUpdate()

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.ActiveWorkout })

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
    cleanup()
  })

  it('does NOT call updateServiceWorker when navigating TO ActiveBenchmark', async () => {
    const { router, cleanup } = await setupPwaUpdate()

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.ActiveBenchmark })

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
    cleanup()
  })

  it('calls updateServiceWorker when navigating AWAY from ActiveWorkout', async () => {
    const { router, cleanup } = await setupPwaUpdate({ startRoute: RouteNames.ActiveWorkout })

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.Home })

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
    cleanup()
  })
})
