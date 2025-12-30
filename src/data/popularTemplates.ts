import type { DbTemplateStrengthBlock } from '@/db/schema'

/**
 * Popular template definition (without runtime fields like id, createdAt).
 */
type PopularTemplate = {
  name: string
  blocks: ReadonlyArray<Omit<DbTemplateStrengthBlock, 'image'> & { image: null }>
}

/**
 * Popular workout templates that are seeded on first app run.
 */
export const popularTemplates: ReadonlyArray<PopularTemplate> = [
  {
    name: 'goku',
    blocks: [
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Goblet Squat',
        equipment: 'kettlebell',
        targetReps: 8,
        defaultSetCount: 3,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Military Press',
        equipment: 'barbell',
        targetReps: 5,
        defaultSetCount: 5,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Deadlift',
        equipment: 'barbell',
        targetReps: 5,
        defaultSetCount: 3,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Bench Press',
        equipment: 'barbell',
        targetReps: 5,
        defaultSetCount: 5,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Lunges',
        equipment: 'bodyweight',
        targetReps: 10,
        defaultSetCount: 3,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Lat Pulldown',
        equipment: 'cable',
        targetReps: 10,
        defaultSetCount: 3,
        image: null,
      },
    ],
  },
  {
    name: 'goku extreme',
    blocks: [
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Goblet Squat',
        equipment: 'kettlebell',
        targetReps: 8,
        defaultSetCount: 3,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Military Press',
        equipment: 'barbell',
        targetReps: 5,
        defaultSetCount: 5,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Deadlift',
        equipment: 'barbell',
        targetReps: 5,
        defaultSetCount: 1,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Bench Press',
        equipment: 'barbell',
        targetReps: 5,
        defaultSetCount: 5,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'One-Arm Dumbbell Row',
        equipment: 'dumbbell',
        targetReps: 10,
        defaultSetCount: 3,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Reverse Lunges',
        equipment: 'bodyweight',
        targetReps: 10,
        defaultSetCount: 3,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Lat Pulldown',
        equipment: 'cable',
        targetReps: 10,
        defaultSetCount: 3,
        image: null,
      },
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Cable Face Pull',
        equipment: 'cable',
        targetReps: 15,
        defaultSetCount: 3,
        image: null,
      },
    ],
  },
]
