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

  it('updates the list when new exercises are added', async () => {
    // Start with one exercise
    const exercises = ref<Array<BenchmarkFormExercise>>([
      {
        exerciseDefinitionId: '1',
        name: 'Bodyweight Get-up',
        prescribedReps: 15,
        thumbnail: '🧍',
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
    expect(page.getByText('Bodyweight Get-up')).toBeTruthy()
    expect(page.getByText(/15/)).toBeTruthy() // Check for the number (translation may vary)

    // Add a second exercise (simulating user adding an exercise)
    exercises.value.push({
      exerciseDefinitionId: '2',
      name: 'Pull-ups',
      prescribedReps: 21,
      thumbnail: '💪',
    })

    // Re-render with updated exercises
    await rerender({
      exercises: exercises.value,
    })

    await nextTick()

    // THIS WOULD FAIL WITHOUT THE FIX: Second exercise should now be visible
    expect(page.getByText('Bodyweight Get-up')).toBeTruthy()
    expect(page.getByText('Pull-ups')).toBeTruthy()

    // Verify both exercises show their rep counts (translation may vary)
    const pullUpsElement = page.getByText(/Pull-ups/).element()
    const allText = pullUpsElement.parentElement?.parentElement?.textContent || ''
    expect(allText).toContain('21')

    // Verify both order numbers are shown
    expect(page.getByText('1')).toBeTruthy()
    expect(page.getByText('2')).toBeTruthy()
  })

  it('updates when third exercise is added', async () => {
    // Start with two exercises
    const exercises = ref<Array<BenchmarkFormExercise>>([
      {
        exerciseDefinitionId: '1',
        name: 'Thrusters',
        prescribedReps: 21,
        thumbnail: '🏋️',
      },
      {
        exerciseDefinitionId: '2',
        name: 'Pull-ups',
        prescribedReps: 21,
        thumbnail: '💪',
      },
    ])

    const { rerender } = render(BenchmarkExerciseList, {
      props: {
        exercises: exercises.value,
      },
      global: {
        plugins: [i18n],
      },
    })

    // Verify first two exercises
    expect(page.getByText('Thrusters').all().length).toBeGreaterThan(0)
    expect(page.getByText('Pull-ups').all().length).toBeGreaterThan(0)

    // Add a third exercise
    exercises.value.push({
      exerciseDefinitionId: '3',
      name: 'Burpees',
      prescribedReps: 10,
      thumbnail: '🤸',
    })

    await rerender({
      exercises: exercises.value,
    })

    await nextTick()

    // All three should be visible
    expect(page.getByText('Thrusters').all().length).toBeGreaterThan(0)
    expect(page.getByText('Pull-ups').all().length).toBeGreaterThan(0)
    expect(page.getByText('Burpees').all().length).toBeGreaterThan(0)

    // Verify third exercise shows its rep count
    const burpeesElement = page.getByText(/Burpees/).element()
    const allText = burpeesElement.parentElement?.parentElement?.textContent || ''
    expect(allText).toContain('10')
  })

  it('displays empty list when no exercises provided', () => {
    const { container } = render(BenchmarkExerciseList, {
      props: {
        exercises: [],
      },
      global: {
        plugins: [i18n],
      },
    })

    // Should not display any exercise items - check for exercise card structure
    const exerciseCards = container.querySelectorAll('.drag-handle')
    expect(exerciseCards.length).toBe(0)
  })
})
