import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { RouteNames } from '@/router'
import type { RouteRecordNameGeneric } from 'vue-router'

const UNSAFE_ROUTES: ReadonlySet<RouteRecordNameGeneric> = new Set([
  RouteNames.ActiveWorkout,
  RouteNames.ActiveBenchmark,
])

/**
 * Applies pending PWA service-worker updates automatically, but only on
 * routes where a reload can't lose in-progress data (never mid-workout).
 */
export function usePwaUpdate() {
  const router = useRouter()
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  watch(
    () => router.currentRoute.value.name,
    (routeName) => {
      if (!needRefresh.value) return

      const isSafeToUpdate = !UNSAFE_ROUTES.has(routeName)
      if (isSafeToUpdate) {
        updateServiceWorker(true)
      }
    },
  )

  return { needRefresh, updateServiceWorker }
}
