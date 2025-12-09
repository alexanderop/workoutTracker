import { computed, ref } from 'vue'

export function useBenchmarkAnimation() {
  const isTransitioning = ref(false)
  const showCheckmark = ref(false)
  const showCompletion = ref(false)
  const completionTime = ref(0)

  const state = computed(() => ({
    isTransitioning: isTransitioning.value,
    showCheckmark: showCheckmark.value,
    showCompletion: showCompletion.value,
    completionTime: completionTime.value,
  }))

  async function playExerciseTransition() {
    isTransitioning.value = true
    showCheckmark.value = true

    // Phase 1: Checkmark (300ms)
    await new Promise(resolve => setTimeout(resolve, 300))

    showCheckmark.value = false
    // Phase 2: Slide transition (500ms)
    await new Promise(resolve => setTimeout(resolve, 500))

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
