/**
 * Sample data for onboarding preview components.
 * These are static examples shown during the onboarding flow.
 */

export type SampleBlock = {
  kind: 'strength' | 'amrap'
  name: string
  sets?: number
  reps?: number
  durationMinutes?: number
}

export type SampleTemplate = {
  name: string
  blockCount: number
}

export type SampleBenchmark = {
  name: string
  type: 'forTime' | 'amrap'
}

export const sampleBlocks: ReadonlyArray<SampleBlock> = [
  { kind: 'strength', name: 'Bench Press', sets: 4, reps: 8 },
  { kind: 'amrap', name: '10min AMRAP', durationMinutes: 10 },
]

export const sampleTemplates: ReadonlyArray<SampleTemplate> = [
  { name: 'Push Day', blockCount: 5 },
  { name: 'Leg Day', blockCount: 4 },
  { name: 'Full Body', blockCount: 6 },
]

export const sampleBenchmarks: ReadonlyArray<SampleBenchmark> = [
  { name: 'Fran', type: 'forTime' },
  { name: 'Cindy', type: 'amrap' },
  { name: 'Murph', type: 'forTime' },
]
