import type { Router } from 'vue-router'
import { i18n } from '@/i18n'

/**
 * Keep document.title in sync with the active route.
 *
 * Before this, every route rendered the same "Workout Tracker" title, so the
 * browser tab/history entry never told you which page you were on (UX
 * review finding: per-route document titles). Routes without a `titleKey`
 * (there shouldn't be any, but new routes can forget to set one) fall back
 * to the bare app name.
 *
 * Exported for use in tests with custom routers (same pattern as
 * setupOnboardingGuard).
 */
export function setupDocumentTitle(router: Router): void {
  router.afterEach((to) => {
    const appName = i18n.global.t('nav.appName')
    const { titleKey } = to.meta

    document.title = titleKey
      ? `${i18n.global.t(`nav.pageTitles.${titleKey}`)} · ${appName}`
      : appName
  })
}
