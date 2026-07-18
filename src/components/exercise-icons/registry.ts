import type { ExerciseIconComponent } from './types'
import type { ExerciseIconKey } from './generated/iconKeys'
import { exerciseIconKeys } from './generated/iconKeys'
import { exerciseIconAliases } from './generated/iconAliases'
import { exerciseIconRegistry } from './generated/iconRegistry'

export type ResolvedExerciseIcon = Readonly<{
  key: ExerciseIconKey
  title: string
  component: ExerciseIconComponent
}>

const overrides = new Map<ExerciseIconKey, ExerciseIconComponent>()

export function normalizeExerciseIconName(value: string): string {
  return value.trim().toLocaleLowerCase('en-US').replaceAll(/[-_]+/g, ' ').replaceAll(/\s+/g, ' ')
}

export function resolveExerciseIconKey(value: string): ExerciseIconKey | null {
  const directKey = exerciseIconKeys.find((key) => key === value)
  if (directKey) return directKey
  return exerciseIconAliases[normalizeExerciseIconName(value)] ?? null
}

export function getExerciseIcon(value: string): ResolvedExerciseIcon | null {
  const key = resolveExerciseIconKey(value)
  if (!key) return null
  const entry = exerciseIconRegistry[key]
  return {
    key,
    title: entry.title,
    component: overrides.get(key) ?? entry.component,
  }
}

/** Set a source-owned app override, or pass null to restore the bundled pose. */
export function setExerciseIconOverride(
  key: ExerciseIconKey,
  component: ExerciseIconComponent | null,
): void {
  if (component) {
    overrides.set(key, component)
    return
  }
  overrides.delete(key)
}
