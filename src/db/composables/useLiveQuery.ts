import { onScopeDispose, readonly, shallowRef, type DeepReadonly, type ShallowRef } from 'vue'
import type { SubscribeCallback, Subscription } from '@/db/interfaces'

/**
 * State returned by live query composables.
 */
export type LiveQueryState<T> = {
  /** Current data value (reactive, readonly) */
  data: DeepReadonly<ShallowRef<T>>
  /** Whether the initial load is complete */
  isReady: DeepReadonly<ShallowRef<boolean>>
}

/**
 * Create a reactive live query from a repository subscribe method.
 * Automatically cleans up subscription when the effect scope is disposed.
 *
 * @param subscribeFn - A function that takes a callback and returns a Subscription
 * @param initialValue - Initial value before first data arrives
 * @returns Reactive state with data and isReady refs
 *
 * @example
 * const { data, isReady } = useLiveQuery(
 *   (cb) => getActiveWorkoutRepository().subscribe(cb),
 *   undefined
 * )
 */
export function useLiveQuery<T>(
  subscribeFn: (callback: SubscribeCallback<T>) => Subscription,
  initialValue: T,
): LiveQueryState<T> {
  const data = shallowRef<T>(initialValue)
  const isReady = shallowRef(false)

  const subscription = subscribeFn((value) => {
    data.value = value
    isReady.value = true
  })

  onScopeDispose(() => {
    subscription.unsubscribe()
  })

  return {
    data: readonly(data),
    isReady: readonly(isReady),
  }
}
