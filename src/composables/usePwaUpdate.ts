import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { RouteNames } from '@/router'
import type { RouteRecordNameGeneric } from 'vue-router'

const UNSAFE_ROUTES: ReadonlySet<RouteRecordNameGeneric> = new Set([
  RouteNames.ActiveWorkout,
  RouteNames.ActiveBenchmark,
])

export function usePwaUpdate() {
  const router = useRouter()
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  watch(
    () => router.currentRoute.value.name,
    (routeName) => {
      if (!needRefresh.value) return

      const isEnteringUnsafeRoute = UNSAFE_ROUTES.has(routeName)
      if (!isEnteringUnsafeRoute) {
        updateServiceWorker(true)
      }
    },
  )

  return { needRefresh, updateServiceWorker }
}
