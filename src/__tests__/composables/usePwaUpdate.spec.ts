import { ref, nextTick } from 'vue'
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
  it('should be defined', async () => {
    const { usePwaUpdate } = await import('@/composables/usePwaUpdate')
    expect(usePwaUpdate).toBeDefined()
  })

  it('does NOT apply an update while needRefresh is false', async () => {
    const { router, cleanup } = await setupPwaUpdate()

    mockNeedRefresh.value = false
    await router.push({ name: RouteNames.Settings })
    await nextTick()

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
    cleanup()
  })

  it('auto-applies a pending update while on a safe route without needing navigation', async () => {
    const { cleanup } = await setupPwaUpdate()

    mockNeedRefresh.value = true
    await nextTick()

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
    cleanup()
  })

  it('applies a pending update when navigating between safe routes', async () => {
    const { router, cleanup } = await setupPwaUpdate()

    mockNeedRefresh.value = true
    await router.push({ name: RouteNames.Settings })
    await nextTick()

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
    cleanup()
  })

  it('does NOT apply a pending update while on ActiveWorkout', async () => {
    const { cleanup } = await setupPwaUpdate({ startRoute: RouteNames.ActiveWorkout })

    mockNeedRefresh.value = true
    await nextTick()

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
    cleanup()
  })

  it('does NOT apply a pending update while on ActiveBenchmark', async () => {
    const { cleanup } = await setupPwaUpdate({ startRoute: RouteNames.ActiveBenchmark })

    mockNeedRefresh.value = true
    await nextTick()

    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
    cleanup()
  })

  it('applies the pending update when navigating away from ActiveWorkout', async () => {
    const { router, cleanup } = await setupPwaUpdate({ startRoute: RouteNames.ActiveWorkout })

    mockNeedRefresh.value = true
    await nextTick()
    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()

    await router.push({ name: RouteNames.Home })
    await nextTick()

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
    cleanup()
  })
})
