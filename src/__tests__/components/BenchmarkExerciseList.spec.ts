import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import BenchmarkExerciseList from '@/features/benchmarks/components/BenchmarkExerciseList.vue'
import type { BenchmarkFormExercise } from '@/features/benchmarks/composables/useBenchmarkForm'
import { nextTick, ref } from 'vue'
import { i18n } from '@/i18n'
import en from '@/i18n/messages/en'

describe('BenchmarkExerciseList', () => {
  // Setup i18n for all tests
  i18n.global.setLocaleMessage('en', en)
  i18n.global.locale.value = 'en'

  it('reactively appends second and third exercises with their prescribed reps', async () => {
    // Start with one exercise
    const exercises = ref<Array<BenchmarkFormExercise>>([
      {
        orderKey: 'a0',
        exerciseDefinitionId: '1',
        name: 'Bodyweight Get-up',
        prescribedReps: 15,
        image: null,
      },
    ])

    // Render with initial exercise
    const { rerender } = render(BenchmarkExerciseList, {
      props: {
        exercises: exercises.value,
      },
      global: {
        plugins: [i18n],
      },
    })

    // Verify first exercise is displayed
    await expect.element(page.getByText('Bodyweight Get-up')).toBeVisible()
    await expect.element(page.getByText(/15 reps/i)).toBeVisible()

    // Add a second exercise (simulating user adding an exercise)
    exercises.value.push({
      orderKey: 'a1',
      exerciseDefinitionId: '2',
      name: 'Pull-ups',
      prescribedReps: 21,
      image: null,
    })

    // Re-render with updated exercises
    await rerender({
      exercises: exercises.value,
    })

    await nextTick()

    // THIS WOULD FAIL WITHOUT THE FIX: Second exercise should now be visible
    await expect.element(page.getByText('Bodyweight Get-up')).toBeVisible()
    await expect.element(page.getByText('Pull-ups')).toBeVisible()

    // Verify both exercises show their rep counts
    await expect.element(page.getByText(/15 reps/i)).toBeVisible()
    await expect.element(page.getByText(/21 reps/i)).toBeVisible()

    // Add a third exercise
    exercises.value.push({
      orderKey: 'a2',
      exerciseDefinitionId: '3',
      name: 'Burpees',
      prescribedReps: 10,
      image: null,
    })

    await rerender({
      exercises: exercises.value,
    })

    await nextTick()

    // All three should be visible
    await expect.element(page.getByText('Bodyweight Get-up')).toBeVisible()
    await expect.element(page.getByText('Pull-ups')).toBeVisible()
    await expect.element(page.getByText('Burpees')).toBeVisible()

    // Verify third exercise shows its rep count
    await expect.element(page.getByText(/10 reps/i)).toBeVisible()
  })

  it('displays empty list when no exercises provided', async () => {
    render(BenchmarkExerciseList, {
      props: {
        exercises: [],
      },
      global: {
        plugins: [i18n],
      },
    })

    // Should not display any exercise items
    await expect.element(page.getByTestId('benchmark-exercise-item')).not.toBeInTheDocument()
  })
})
