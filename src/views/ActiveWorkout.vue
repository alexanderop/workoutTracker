<script setup lang="ts">
import { ref } from 'vue'
import AddExerciseDialog from '@/components/workout/AddExerciseDialog.vue'
import ExerciseCarousel from '@/components/workout/ExerciseCarousel.vue'
import PreviousHistory from '@/components/workout/PreviousHistory.vue'
import RestTimerWidget from '@/components/workout/RestTimerWidget.vue'
import SetTable from '@/components/workout/SetTable.vue'
import WorkoutHeader from '@/components/workout/WorkoutHeader.vue'
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
    <ExerciseCarousel
      :exercises="workout.exercises"
      :selected-id="workout.selectedExerciseId"
      @select="selectExercise"
      @remove="removeExercise"
      @add-exercise="showAddExercise = true"
    />

    <!-- Main Content -->
    <div class="flex-1 p-4 overflow-y-auto">
      <!-- Sets Table -->
      <SetTable
        :sets="selectedExercise?.sets || []"
        @toggle-complete="toggleSetComplete"
      />

      <!-- Previous History -->
      <PreviousHistory
        :sets="selectedExercise?.sets || []"
        date="Fr, 7. Nov"
      />
    </div>

    <!-- Rest Timer & Action Buttons -->
    <RestTimerWidget :timer="timer" />

    <!-- Add Exercise Dialog -->
    <AddExerciseDialog
      :open="showAddExercise"
      @update:open="showAddExercise = $event"
      @add="addExercise"
    />
  </div>
</template>
