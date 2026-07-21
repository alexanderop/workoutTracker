import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEventListener, useIntervalFn } from '@vueuse/core'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { RouteNames } from '@/router'
import type { RouteRecordNameGeneric } from 'vue-router'

const UNSAFE_ROUTES: ReadonlySet<RouteRecordNameGeneric> = new Set([
  RouteNames.ActiveWorkout,
  RouteNames.ActiveBenchmark,
])

// How often to ask the browser to re-check for a freshly deployed service
// worker while the app stays open. An installed PWA otherwise only re-checks
// the SW script on a cold start or roughly once a day, so without this a new
// deploy is never picked up mid-session — which is exactly the on-phone,
// app-kept-open case that matters here.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Keeps the PWA on the latest deployed version automatically — the user never
 * has to reload by hand.
 *
 * Two halves:
 * - Detection: periodically (and whenever the app regains visibility) ask the
 *   browser to re-check the service worker, so a new deploy is noticed while
 *   the app is open.
 * - Application: apply a pending update by reloading, but only on routes where
 *   a reload can't lose in-progress data (never mid-workout/-benchmark).
 */
export function usePwaUpdate() {
  const router = useRouter()
  const swRegistration = ref<ServiceWorkerRegistration | undefined>()

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      swRegistration.value = registration
    },
  })

  async function checkForUpdate() {
    const registration = swRegistration.value
    if (!registration || registration.installing) return
    if (!navigator.onLine) return
    await registration.update()
  }

  // Background timers are throttled/frozen on mobile, so the interval alone
  // won't fire after the PWA has been backgrounded for a while — re-check the
  // moment the user returns to it.
  useIntervalFn(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForUpdate()
  })

  // Apply a pending update as soon as we're on a safe route. Reacting to
  // `needRefresh` (not just route changes) also covers an update landing while
  // the user sits idle on a safe screen without navigating.
  watch(
    [needRefresh, () => router.currentRoute.value.name],
    ([isPending, routeName]) => {
      if (!isPending) return
      if (UNSAFE_ROUTES.has(routeName)) return
      updateServiceWorker(true)
    },
    { immediate: true },
  )

  return { needRefresh, updateServiceWorker, checkForUpdate }
}
