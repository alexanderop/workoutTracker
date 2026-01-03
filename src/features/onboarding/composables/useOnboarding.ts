import { createGlobalState, useMediaQuery } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import { getOnboardingRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

/**
 * Global onboarding state management.
 * Uses singleton pattern via createGlobalState for consistent state across components.
 */
export const useOnboarding = createGlobalState(() => {
  const currentStep = ref(0)
  const completed = ref(false)
  const isReturningUser = ref(false)
  const isLoaded = ref(false)
  const isLoading = ref(false)

  // PWA detection using VueUse
  const isPwaStandalone = useMediaQuery('(display-mode: standalone)')

  // Safari iOS PWA detection fallback
  const isSafariStandalone = computed(() => {
    if (globalThis.navigator === undefined) return false
    // Navigator with standalone property (Safari iOS)
    const nav = globalThis.navigator
    if (!('standalone' in nav)) return false
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Safari-specific navigator property
    return (nav as unknown as { standalone: boolean }).standalone === true
  })

  const isPwaInstalled = computed(() => isPwaStandalone.value || isSafariStandalone.value)

  // Total slides: 5 if PWA installed (skip PWA slide), 6 otherwise
  const totalSlides = computed(() => (isPwaInstalled.value ? 5 : 6))

  /**
   * Load onboarding state from database.
   */
  async function loadFromDatabase(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    const [error, state] = await tryCatch(getOnboardingRepository().get())
    isLoading.value = false

    if (error) {
      // Fail-open: assume completed on error
      completed.value = true
      isLoaded.value = true
      return
    }

    currentStep.value = state.currentStep
    completed.value = state.completed
    isLoaded.value = true
  }

  /**
   * Update the current step and persist to database.
   */
  async function setCurrentStep(step: number): Promise<void> {
    currentStep.value = step
    await tryCatch(getOnboardingRepository().update({ currentStep: step }))
  }

  /**
   * Mark onboarding as completed.
   */
  async function completeOnboarding(): Promise<void> {
    completed.value = true
    currentStep.value = 0
    await tryCatch(getOnboardingRepository().complete())
  }

  /**
   * Skip onboarding (same as complete, but semantically different).
   */
  async function skipOnboarding(): Promise<void> {
    await completeOnboarding()
  }

  /**
   * Set returning user flag (used by router guard when existing data detected).
   */
  function setReturningUser(returning: boolean): void {
    isReturningUser.value = returning
  }

  /**
   * Reset state for testing.
   */
  function $reset(): void {
    currentStep.value = 0
    completed.value = false
    isReturningUser.value = false
    isLoaded.value = false
    isLoading.value = false
  }

  return reactive({
    currentStep,
    completed,
    isReturningUser,
    isPwaInstalled,
    totalSlides,
    isLoaded,
    isLoading,
    loadFromDb: loadFromDatabase,
    setCurrentStep,
    completeOnboarding,
    skipOnboarding,
    setReturningUser,
    $reset,
  })
})
