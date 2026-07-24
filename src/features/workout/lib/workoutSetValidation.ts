import type { Set } from '@/types/workout'

export function isSetReady(set: Readonly<Set>): boolean {
  const kg = Number(set.kg)
  const reps = Number(set.reps)
  const rir = Number(set.rir)
  return set.kg !== '' && kg >= 0 && reps > 0 && rir >= 0 && set.rir !== ''
}

export function isSetReadyForDuration(set: Readonly<Set>): boolean {
  const duration = Number(set.duration)
  return set.duration !== '' && duration > 0
}
