/**
 * Sample data for onboarding preview components.
 * These are static, non-interactive displays.
 */

export const sampleBlocks = [
  { kind: 'strength', name: 'Bench Press', sets: 4, reps: 8 },
  { kind: 'amrap', name: '10min AMRAP', duration: 600 },
] as const

export const sampleTemplates = [
  { name: 'Push Day', blockCount: 5 },
  { name: 'Leg Day', blockCount: 4 },
  { name: 'Full Body', blockCount: 6 },
] as const

export const sampleBenchmarks = [
  { name: 'Fran', type: 'forTime' },
  { name: 'Cindy', type: 'amrap' },
  { name: 'Murph', type: 'forTime' },
] as const

export type SampleBlock = (typeof sampleBlocks)[number]
export type SampleTemplate = (typeof sampleTemplates)[number]
export type SampleBenchmark = (typeof sampleBenchmarks)[number]
