import { onMounted, onUnmounted, shallowRef } from 'vue'
import type { LiveQuery } from '@/db'

/**
 * Bridges a repository `LiveQuery<T>` into Vue reactivity. Reads the initial
 * snapshot via `get()` on mount, then keeps `data` in sync via `subscribe()`
 * until the owning component unmounts.
 *
 * `shallowRef` is deliberate: live query snapshots are replaced wholesale on
 * every emission, so deep reactivity tracking on nested fields is unnecessary
 * overhead (see brain/reference/reviews/repo-dexie-review.md).
 */
export function useLiveQuery<T>(make: () => LiveQuery<T>) {
  const data = shallowRef<T>()
  let stop: (() => void) | undefined

  onMounted(() => {
    const query = make()
    query.get().then((value) => {
      data.value = value
    })
    stop = query.subscribe((value) => {
      data.value = value
    })
  })

  onUnmounted(() => stop?.())

  return { data }
}
