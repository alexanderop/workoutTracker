import { popularExercises } from '@/data/popularExercises'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { TemplateExercise } from '@/features/templates/components/TemplateExerciseList.vue'

/**
 * Generates a unique exercise ID for template creation.
 */
export function generateExerciseId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Creates a template exercise from an Exercise object.
 * Prefers popular exercise data when available, otherwise uses the provided exercise data.
 */
export function createTemplateExercise(exercise: Exercise): TemplateExercise {
  const popularExercise = popularExercises.find((ex) => ex.name === exercise.name)

  return {
    exerciseId: generateExerciseId(),
    name: exercise.name,
    equipment: popularExercise?.equipment ?? exercise.equipment ?? '',
    thumbnail: popularExercise?.icon ?? exercise.icon,
    defaultSetCount: 3,
  }
}
