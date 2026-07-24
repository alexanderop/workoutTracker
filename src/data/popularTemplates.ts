import type { DbTemplateStrengthBlock } from '@/blocks'

/**
 * Popular template definition (without runtime fields like id, createdAt).
 */
type PopularTemplate = {
  name: string
  blocks: ReadonlyArray<Omit<DbTemplateStrengthBlock, 'image'> & { image: null }>
}

type PopularTemplateBlock = PopularTemplate['blocks'][number]

function strengthBlock(
  name: string,
  equipment: DbTemplateStrengthBlock['equipment'],
  targetReps: number,
  defaultSetCount: number,
): PopularTemplateBlock {
  return {
    kind: 'strength',
    exerciseDefinitionId: null,
    name,
    equipment,
    targetReps,
    targetDuration: null,
    targetWeight: null,
    defaultSetCount,
    image: null,
  }
}

/**
 * Popular workout templates that are seeded on first app run.
 */
export const popularTemplates: ReadonlyArray<PopularTemplate> = [
  {
    name: 'goku',
    blocks: [
      strengthBlock('Goblet Squat', 'kettlebell', 8, 3),
      strengthBlock('Military Press', 'barbell', 5, 5),
      strengthBlock('Deadlift', 'barbell', 5, 3),
      strengthBlock('Bench Press', 'barbell', 5, 5),
      strengthBlock('Lunges', 'bodyweight', 10, 3),
      strengthBlock('Lat Pulldown', 'cable', 10, 3),
    ],
  },
  {
    name: 'goku extreme',
    blocks: [
      strengthBlock('Goblet Squat', 'kettlebell', 8, 3),
      strengthBlock('Military Press', 'barbell', 5, 5),
      strengthBlock('Deadlift', 'barbell', 5, 1),
      strengthBlock('Bench Press', 'barbell', 5, 5),
      strengthBlock('One-Arm Dumbbell Row', 'dumbbell', 10, 3),
      strengthBlock('Reverse Lunges', 'bodyweight', 10, 3),
      strengthBlock('Lat Pulldown', 'cable', 10, 3),
      strengthBlock('Cable Face Pull', 'cable', 15, 3),
    ],
  },
  {
    name: 'push-pull',
    blocks: [
      strengthBlock('Military Press', 'barbell', 5, 5),
      strengthBlock('Lat Pulldown', 'cable', 10, 3),
      strengthBlock('Bench Press', 'barbell', 7, 4),
      strengthBlock('Chest Supported Row', 'machine', 11, 3),
      strengthBlock('Cable Face Pull', 'cable', 17, 3),
      strengthBlock('Tricep Extension', 'cable', 11, 3),
    ],
  },
  {
    name: 'legs',
    blocks: [
      strengthBlock('Deadlift', 'barbell', 5, 1),
      strengthBlock('Leg Press', 'machine', 9, 3),
      strengthBlock('Leg Extension', 'machine', 13, 3),
      strengthBlock('Leg Curl', 'machine', 13, 3),
      strengthBlock('Standing Calf Raise Machine', 'machine', 15, 3),
      strengthBlock('Plank', 'bodyweight', 45, 3),
    ],
  },
]
