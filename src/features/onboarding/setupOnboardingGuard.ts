import type { Router } from 'vue-router'
import { useOnboarding } from './composables/useOnboarding'

/**
 * Setup onboarding navigation guard on a router.
 * Redirects first-time users to onboarding, completed users to their destination.
 * Exported for use in tests with custom routers.
 */
export function setupOnboardingGuard(router: Router): void {
  router.beforeEach(async (to) => {
    const onboarding = useOnboarding()

    // Initialize onboarding state if not already done
    if (!onboarding.isInitialized.value) {
      await onboarding.initialize()
    }

    // If navigating to onboarding route
    if (to.name === 'Onboarding') {
      // Completed users get redirected to home
      if (onboarding.completed.value) {
        return { name: 'Home' }
      }
      // Check for returning user and set flag
      const hasExistingData = await onboarding.checkExistingData()
      onboarding.setReturningUser(hasExistingData)
      return true
    }

    // For all other routes, check if onboarding is needed
    if (!onboarding.completed.value) {
      const hasExistingData = await onboarding.checkExistingData()
      onboarding.setReturningUser(hasExistingData)
      return { name: 'Onboarding' }
    }

    return true
  })
}
