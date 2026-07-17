/**
 * Router assembly — the composition root for router-level behavior.
 *
 * Lives outside `src/router/` on purpose: the route table must not depend on
 * features (architecture rule "router should not import from features"), so
 * feature-level guards are wired here, next to `main.ts`, the same way
 * `main.ts` wires the persistence provider.
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { Router, RouterHistory } from 'vue-router'
import { setupOnboardingGuard } from '@/features/onboarding/setupOnboardingGuard'
import { routes } from '@/router'
import { setupDocumentTitle } from '@/router/documentTitle'

/**
 * Build a fully wired app router: routes plus every router-level behavior
 * (per-route document titles, onboarding guard). Tests pass
 * `createMemoryHistory()` so integration suites exercise exactly the
 * production setup instead of re-assembling it hook by hook.
 */
export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
): Router {
  const router = createRouter({ history, routes })
  setupDocumentTitle(router)
  setupOnboardingGuard(router)
  return router
}

export const router = createAppRouter()
