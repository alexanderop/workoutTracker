<script setup lang="ts">
import { ref } from 'vue'
import AddExerciseDialog from '@/components/workout/AddExerciseDialog.vue'
import WorkoutExerciseCarousel from '@/components/workout/WorkoutExerciseCarousel.vue'
import WorkoutHeader from '@/components/workout/WorkoutHeader.vue'
import WorkoutPreviousHistory from '@/components/workout/WorkoutPreviousHistory.vue'
import WorkoutRestTimerWidget from '@/components/workout/WorkoutRestTimerWidget.vue'
import WorkoutSetTable from '@/components/workout/WorkoutSetTable.vue'
import { useRestTimer } from '@/composables/useRestTimer'
import { useWorkout } from '@/composables/useWorkout'

const { workout, selectedExercise, selectExercise, toggleSetComplete, addExercise, removeExercise } = useWorkout()
const timer = useRestTimer()

const showAddExercise = ref(false)
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">
    <!-- Header -->
    <WorkoutHeader
      :exercise-name="selectedExercise?.name || ''"
      :equipment="selectedExercise?.equipment || ''"
      :target-reps="selectedExercise?.targetReps || 0"
      @delete="removeExercise(selectedExercise?.id || 0)"
    />

    <!-- Exercise Carousel -->
    <WorkoutExerciseCarousel
      :exercises="workout.exercises"
      :selected-id="workout.selectedExerciseId"
      @select="selectExercise"
      @remove="removeExercise"
      @add-exercise="showAddExercise = true"
    />

    <!-- Main Content -->
    <div class="flex-1 p-4 overflow-y-auto">
      <!-- Sets Table -->
      <WorkoutSetTable
        :sets="selectedExercise?.sets || []"
        @toggle-complete="toggleSetComplete"
      />

      <!-- Previous History -->
      <WorkoutPreviousHistory
        :sets="selectedExercise?.sets || []"
        date="Fr, 7. Nov"
      />
    </div>

    <!-- Rest Timer & Action Buttons -->
    <WorkoutRestTimerWidget :timer="timer" />

    <!-- Add Exercise Dialog -->
    <AddExerciseDialog
      :open="showAddExercise"
      @update:open="showAddExercise = $event"
      @add="addExercise"
    />
  </div>
</template>
