import { computed, onScopeDispose, ref } from 'vue'

export function useBenchmarkAnimation() {
  const isTransitioning = ref(false)
  const showCheckmark = ref(false)
  const showCompletion = ref(false)
  const completionTime = ref(0)

  // Track timeout IDs for cleanup on disposal
  const timeoutIds = new Set<ReturnType<typeof setTimeout>>()

  onScopeDispose(() => {
    timeoutIds.forEach(clearTimeout)
    timeoutIds.clear()
  })

  const state = computed(() => ({
    isTransitioning: isTransitioning.value,
    showCheckmark: showCheckmark.value,
    showCompletion: showCompletion.value,
    completionTime: completionTime.value,
  }))

  function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const id = setTimeout(() => {
        timeoutIds.delete(id)
        resolve()
      }, ms)
      timeoutIds.add(id)
    })
  }

  async function playExerciseTransition() {
    isTransitioning.value = true
    showCheckmark.value = true

    // Phase 1: Checkmark (300ms)
    await delay(300)

    showCheckmark.value = false
    // Phase 2: Slide transition (500ms)
    await delay(500)

    isTransitioning.value = false
  }

  function showCompletionScreen(time: number) {
    showCompletion.value = true
    completionTime.value = time
  }

  function reset() {
    isTransitioning.value = false
    showCheckmark.value = false
    showCompletion.value = false
    completionTime.value = 0
  }

  return {
    state,
    playExerciseTransition,
    showCompletion: showCompletionScreen,
    reset,
  }
}
