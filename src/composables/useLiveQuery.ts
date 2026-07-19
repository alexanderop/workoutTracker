import { tryOnScopeDispose } from '@vueuse/core'
import type { ShallowRef } from 'vue'
import { shallowReadonly, shallowRef, watch } from 'vue'
import type { LiveQuery } from '@/db'

export type UseLiveQueryReturn<T> = {
  data: Readonly<ShallowRef<T | undefined>>
  /** Manually stop the live subscription. */
  stop: () => void
}

/**
 * Bridges a repository `LiveQuery<T>` into Vue reactivity. Subscribes at setup
 * time (the subscription emits the current snapshot immediately, see
 * {@link LiveQuery.subscribe}) and keeps `data` in sync until the owning
 * effect scope is disposed or `stop()` is called.
 *
 * Reactive values read inside `make` (e.g. `toValue(limit)`) are tracked
 * automatically: when they change, the old subscription is torn down and the
 * factory re-runs — no separate dependency bookkeeping needed.
 *
 * `shallowRef` is deliberate: live query snapshots are replaced wholesale on
 * every emission, so deep reactivity tracking on nested fields is unnecessary
 * overhead.
 *
 * @param make Factory creating the `LiveQuery`; re-invoked whenever its reactive dependencies change
 */
export function useLiveQuery<T>(make: () => LiveQuery<T>): UseLiveQueryReturn<T> {
  const data = shallowRef<T>()
  let unsubscribe: (() => void) | undefined

  // The watcher both performs the initial subscription and re-subscribes when
  // a reactive dependency of `make` changes.
  const unwatch = watch(
    make,
    (query) => {
      unsubscribe?.()
      unsubscribe = query.subscribe((value) => {
        data.value = value
      })
    },
    { immediate: true },
  )

  function stop() {
    unwatch()
    unsubscribe?.()
    unsubscribe = undefined
  }

  tryOnScopeDispose(stop)

  return { data: shallowReadonly(data), stop }
}
