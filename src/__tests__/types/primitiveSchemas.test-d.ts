import { expectTypeOf } from 'vitest'
import type { z } from 'zod'
import type { ExerciseType, Metrics, Muscle } from '@/types/exercises'
import {
  exerciseTypeSchema,
  metricsSchema,
  muscleSchema,
} from '@/features/settings/utils/validation/primitiveSchemas'

expectTypeOf<z.output<typeof muscleSchema>>().toEqualTypeOf<Muscle>()
expectTypeOf<z.output<typeof exerciseTypeSchema>>().toEqualTypeOf<ExerciseType>()
expectTypeOf<z.output<typeof metricsSchema>>().toEqualTypeOf<Metrics>()

// @ts-expect-error schemas must not infer unsupported muscle groups
const invalidMuscle: z.output<typeof muscleSchema> = 'glutes'
// @ts-expect-error schemas must not infer unsupported exercise types
const invalidExerciseType: z.output<typeof exerciseTypeSchema> = 'mobility'
// @ts-expect-error schemas must not infer unsupported metrics
const invalidMetrics: z.output<typeof metricsSchema> = 'pace'
void [invalidMuscle, invalidExerciseType, invalidMetrics]
