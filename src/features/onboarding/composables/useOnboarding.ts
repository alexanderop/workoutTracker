import { createGlobalState, useMediaQuery } from '@vueuse/core'
import { computed, ref } from 'vue'
import { getOnboardingRepository, getWorkoutsRepository, getTemplatesRepository, getBenchmarksRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

/**
 * Global state for onboarding flow.
 * Manages completion status, current step, and PWA detection.
 */
export const useOnboarding = createGlobalState(() => {
  // State
  const currentStep = ref(0)
  const completed = ref(false)
  const isReturningUser = ref(false)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // PWA detection
  const isPwaStandalone = useMediaQuery('(display-mode: standalone)')
  const isSafariStandalone = computed(() => {
    const nav = globalThis.navigator
    return 'standalone' in nav && nav.standalone === true
  })
  const isPWA = computed(() => isPwaStandalone.value || isSafariStandalone.value)

  // Total slides: 5 if PWA (skip install slide), 6 otherwise
  const totalSlides = computed(() => (isPWA.value ? 5 : 6))

  /**
   * Initialize onboarding state from database.
   * Should be called before router guard checks.
   */
  async function initialize(): Promise<void> {
    if (isLoading.value || isInitialized.value) return

    isLoading.value = true
    const [error, state] = await tryCatch(getOnboardingRepository().get())

    if (error) {
      // Fail-safe: assume NOT complete to ensure new users see onboarding
      // If DB is truly broken, user can skip/complete onboarding to fix state
      completed.value = false
      isLoading.value = false
      isInitialized.value = true
      return
    }

    completed.value = state.completed
    currentStep.value = state.currentStep
    isLoading.value = false
    isInitialized.value = true
  }

  /**
   * Check if user has existing data (workouts, templates, or benchmarks).
   * Used to show "Welcome back" variant.
   */
  async function checkExistingData(): Promise<boolean> {
    const [error, counts] = await tryCatch(
      Promise.all([
        getWorkoutsRepository().count(),
        getTemplatesRepository().getAll().then((t) => t.length),
        getBenchmarksRepository().getAll().then((b) => b.length),
      ]),
    )

    if (error) {
      return false
    }

    const [workoutCount, templateCount, benchmarkCount] = counts
    return workoutCount > 0 || templateCount > 0 || benchmarkCount > 0
  }

  /**
   * Update and persist the current step.
   */
  async function setStep(step: number): Promise<void> {
    currentStep.value = step
    await tryCatch(getOnboardingRepository().save({ currentStep: step }))
  }

  /**
   * Mark onboarding as complete.
   */
  async function markComplete(): Promise<void> {
    completed.value = true
    await tryCatch(getOnboardingRepository().markComplete())
  }

  /**
   * Set returning user flag (called from router guard).
   */
  function setReturningUser(value: boolean): void {
    isReturningUser.value = value
  }

  /**
   * Reset state for testing purposes.
   */
  function $reset(): void {
    currentStep.value = 0
    completed.value = false
    isReturningUser.value = false
    isLoading.value = false
    isInitialized.value = false
  }

  return {
    // State
    currentStep,
    completed,
    isReturningUser,
    isLoading,
    isInitialized,
    isPWA,
    totalSlides,
    // Methods
    initialize,
    checkExistingData,
    setStep,
    markComplete,
    setReturningUser,
    $reset,
  }
})
