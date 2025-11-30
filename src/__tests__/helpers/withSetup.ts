import type { App } from 'vue'
import { createApp } from 'vue'

/**
 * Mounts a minimal Vue app to trigger lifecycle hooks.
 * Use this for testing composables that depend on onMounted, onUnmounted, etc.
 *
 * @param composable - The composable function to run in component context
 * @returns A tuple of [result, app] where result is the composable return value
 *
 * @example
 * const [result, app] = withSetup(() => useLocalStorage('key', 'initial'))
 * expect(result.value.value).toBe('initial')
 * app.unmount()
 */
export function withSetup<TResult>(composable: () => TResult): [TResult, App] {
  let result: TResult
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    },
  })
  app.mount(document.createElement('div'))
  // @ts-expect-error - result is assigned synchronously in setup
  return [result, app]
}
