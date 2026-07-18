export { default as ExerciseIcon } from './ExerciseIcon.vue'
export {
  getExerciseIcon,
  normalizeExerciseIconName,
  resolveExerciseIconKey,
  setExerciseIconOverride,
} from './registry'
export { exerciseIconKeys } from './generated/iconKeys'
export type { ExerciseIconKey } from './generated/iconKeys'
export type { ExerciseIconComponent, ExerciseIconManifestEntry } from './types'
