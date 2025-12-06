// Public API for workout feature

// Components
export { default as WorkoutActiveMode } from './components/WorkoutActiveMode.vue'
export { default as WorkoutAddBlockDialog } from './components/WorkoutAddBlockDialog.vue'
export { default as WorkoutBuilderMode } from './components/WorkoutBuilderMode.vue'
export { default as WorkoutCancelDialog } from './components/WorkoutCancelDialog.vue'
export { default as WorkoutConfigureAmrapDialog } from './components/WorkoutConfigureAmrapDialog.vue'
export { default as WorkoutConfigureEmomDialog } from './components/WorkoutConfigureEmomDialog.vue'
export { default as WorkoutConfigureForTimeDialog } from './components/WorkoutConfigureForTimeDialog.vue'
export { default as WorkoutConfigureTabataDialog } from './components/WorkoutConfigureTabataDialog.vue'
export { default as WorkoutDetailExerciseCard } from './components/WorkoutDetailExerciseCard.vue'
export { default as WorkoutDetailStatsRow } from './components/WorkoutDetailStatsRow.vue'
export { default as WorkoutEditExerciseDialog } from './components/WorkoutEditExerciseDialog.vue'
export { default as WorkoutExercisePicker } from './components/WorkoutExercisePicker.vue'
export { default as WorkoutFinishDialog } from './components/WorkoutFinishDialog.vue'
export { default as WorkoutQueueDrawer } from './components/WorkoutQueueDrawer.vue'

// Types from components
export type { ExerciseEditData } from './components/WorkoutEditExerciseDialog.vue'

// Composables
export { useAppInitialization, resetInitState } from './composables/useAppInitialization'
export {
  useWorkout,
  getWorkoutRef,
  resetWorkout,
  restoreWorkout,
} from './composables/useWorkout'
export { useWorkoutDetail } from './composables/useWorkoutDetail'
export { useWorkoutMode } from './composables/useWorkoutMode'
export { useWorkoutPersistence } from './composables/useWorkoutPersistence'

// Lib
export { getDefaultWorkoutName } from './lib/workoutName'
