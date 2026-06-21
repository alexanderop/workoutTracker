# Vue Composable Test Helpers

Complete implementations of test helper functions for testing Vue composables with Vitest.

## withSetup

Use for composables that depend on lifecycle hooks (`onMounted`, `onUnmounted`, etc.).

```ts
// src/__tests__/helpers/withSetup.ts
import type { App } from 'vue'
import { createApp } from 'vue'

/**
 * Create a Vue app context to test composables that use lifecycle hooks.
 *
 * @param composable - Factory function that calls the composable
 * @returns Tuple of [composable result, Vue app instance]
 *
 * @example
 * const [result, app] = withSetup(() => useLocalStorage('key', 'value'))
 * expect(result.value.value).toBe('value')
 * app.unmount() // Always cleanup
 */
export function withSetup<TResult>(composable: () => TResult): [TResult, App] {
  let result: TResult

  const app = createApp({
    setup() {
      result = composable()
      // Return empty render function
      return () => {}
    },
  })

  app.mount(document.createElement('div'))

  // @ts-expect-error result is assigned in setup before mount returns
  return [result, app]
}
```

### Usage Examples

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { useCounter } from '../useCounter'
import { withSetup } from './helpers/withSetup'

describe('useCounter', () => {
  let app: App

  afterEach(() => {
    app?.unmount()
  })

  it('initializes with default value', () => {
    const [result, appInstance] = withSetup(() => useCounter())
    app = appInstance

    expect(result.count.value).toBe(0)
  })

  it('increments on mount', () => {
    const [result, appInstance] = withSetup(() => useCounter({ incrementOnMount: true }))
    app = appInstance

    expect(result.count.value).toBe(1)
  })
})
```

---

## useInjectedSetup

Use for composables that depend on `inject` to receive values from ancestor components.

```ts
// src/__tests__/helpers/useInjectedSetup.ts
import type { App, InjectionKey } from 'vue'
import { createApp, defineComponent, h, provide } from 'vue'

/**
 * Configuration for a single injection
 */
export interface InjectionConfig {
  key: InjectionKey<unknown> | string
  value: unknown
}

/**
 * Create a Vue app context with provided values for testing inject-dependent composables.
 *
 * @param setup - Factory function that calls the composable
 * @param injections - Array of injection configurations
 * @returns Composable result merged with unmount function
 *
 * @example
 * const result = useInjectedSetup(
 *   () => useTheme(),
 *   [{ key: ThemeKey, value: 'dark' }]
 * )
 * expect(result.theme).toBe('dark')
 * result.unmount()
 */
export function useInjectedSetup<TResult>(
  setup: () => TResult,
  injections: ReadonlyArray<InjectionConfig> = []
): TResult & { unmount: () => void } {
  let result!: TResult

  // Component that executes the composable
  const TestComponent = defineComponent({
    setup() {
      result = setup()
      return () => h('div')
    },
  })

  // Provider component that wraps TestComponent with injections
  const ProviderComponent = defineComponent({
    setup() {
      injections.forEach(({ key, value }) => {
        provide(key, value)
      })
      return () => h(TestComponent)
    },
  })

  const el = document.createElement('div')
  const app = createApp(ProviderComponent)
  app.mount(el)

  return {
    ...result,
    unmount: () => app.unmount(),
  }
}
```

### Usage Examples

```ts
import type { InjectionKey } from 'vue'
import { describe, expect, it } from 'vitest'
import { useInjectedSetup } from './helpers/useInjectedSetup'

// Define injection key
const UserKey: InjectionKey<{ name: string, role: string }> = Symbol('user')

// Composable that uses inject
function useUser() {
  const user = inject(UserKey)
  if (!user)
    throw new Error('User must be provided')
  return {
    user,
    isAdmin: () => user.role === 'admin',
  }
}

describe('useUser', () => {
  it('accesses injected user', () => {
    const result = useInjectedSetup(
      () => useUser(),
      [{ key: UserKey, value: { name: 'Alice', role: 'admin' } }]
    )

    expect(result.user.name).toBe('Alice')
    expect(result.isAdmin()).toBe(true)

    result.unmount()
  })

  it('throws without provider', () => {
    expect(() => useInjectedSetup(() => useUser(), [])).toThrow('User must be provided')
  })
})
```

---

## withRouter

Use for composables that depend on Vue Router (`useRoute`, `useRouter`).

```ts
// src/__tests__/helpers/withRouter.ts
import type { App } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

interface RouterSetupOptions {
  route?: Partial<RouteLocationNormalizedLoaded>
  routes?: Array<{ path: string, component: object }>
}

/**
 * Create a Vue app context with router for testing router-dependent composables.
 *
 * @param composable - Factory function that calls the composable
 * @param options - Router configuration options
 * @returns Tuple of [composable result, Vue app, router]
 */
export async function withRouter<TResult>(
  composable: () => TResult,
  options: RouterSetupOptions = {}
): Promise<[TResult, App, Router]> {
  let result: TResult

  const routes = options.routes ?? [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/test', component: { template: '<div>Test</div>' } },
  ]

  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    },
  })

  app.use(router)

  if (options.route?.path) {
    await router.push(options.route.path)
  }

  app.mount(document.createElement('div'))
  await router.isReady()

  // @ts-expect-error result is assigned in setup
  return [result, app, router]
}
```

### Usage Examples

```ts
import { describe, expect, it } from 'vitest'
import { useCurrentPath } from '../useCurrentPath'
import { withRouter } from './helpers/withRouter'

describe('useCurrentPath', () => {
  it('returns current route path', async () => {
    const [result, app] = await withRouter(
      () => useCurrentPath(),
      { route: { path: '/test' } }
    )

    expect(result.path.value).toBe('/test')
    app.unmount()
  })
})
```

---

## Combined Helper

For composables that need both lifecycle hooks and injections:

```ts
// src/__tests__/helpers/withContext.ts
import type { App, InjectionKey } from 'vue'
import { createApp, defineComponent, h, provide } from 'vue'

interface InjectionConfig {
  key: InjectionKey<unknown> | string
  value: unknown
}

interface ContextOptions {
  injections?: ReadonlyArray<InjectionConfig>
}

/**
 * Create a full Vue component context for testing composables that need
 * both lifecycle hooks and dependency injection.
 */
export function withContext<TResult>(
  composable: () => TResult,
  options: ContextOptions = {}
): { result: TResult, app: App, unmount: () => void } {
  let result!: TResult

  const TestComponent = defineComponent({
    setup() {
      result = composable()
      return () => h('div')
    },
  })

  const ProviderComponent = defineComponent({
    setup() {
      options.injections?.forEach(({ key, value }) => {
        provide(key, value)
      })
      return () => h(TestComponent)
    },
  })

  const el = document.createElement('div')
  const app = createApp(ProviderComponent)
  app.mount(el)

  return {
    result,
    app,
    unmount: () => app.unmount(),
  }
}
```

---

## Test Setup File

Add this to your Vitest setup for automatic cleanup:

```ts
// src/__tests__/setup.ts
import { afterEach } from 'vitest'

// Track mounted apps for cleanup
const mountedApps: Array<{ unmount: () => void }> = []

export function trackApp(app: { unmount: () => void }) {
  mountedApps.push(app)
}

afterEach(() => {
  mountedApps.forEach(app => app.unmount())
  mountedApps.length = 0
})
```

Configure in `vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
```
