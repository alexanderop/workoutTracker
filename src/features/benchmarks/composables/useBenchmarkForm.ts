import { computed, ref } from 'vue'

type BenchmarkType = 'fortime' | 'rounds'

type BenchmarkFormState = {
  name: string
  type: BenchmarkType
  rounds: number
}

function createInitialState(): BenchmarkFormState {
  return {
    name: '',
    type: 'fortime',
    rounds: 5,
  }
}

export function useBenchmarkForm() {
  const form = ref<BenchmarkFormState>(createInitialState())

  const isNameValid = computed(() => form.value.name.trim().length > 0)
  const isSaveDisabled = computed(() => !isNameValid.value)
  const showRoundsInput = computed(() => form.value.type === 'rounds')

  function reset() {
    form.value = createInitialState()
  }

  function getFormData(): BenchmarkFormState {
    return {
      ...form.value,
      name: form.value.name.trim(),
    }
  }

  return {
    form,
    isNameValid,
    isSaveDisabled,
    showRoundsInput,
    reset,
    getFormData,
  }
}
