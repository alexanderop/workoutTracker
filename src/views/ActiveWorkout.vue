<script setup lang="ts">
import { ref } from 'vue'
import { Dumbbell, Plus } from 'lucide-vue-next'
import AddExerciseDialog from '@/components/workout/AddExerciseDialog.vue'
import WorkoutExerciseCarousel from '@/components/workout/WorkoutExerciseCarousel.vue'
import WorkoutHeader from '@/components/workout/WorkoutHeader.vue'
import WorkoutPreviousHistory from '@/components/workout/WorkoutPreviousHistory.vue'
import WorkoutRestTimerWidget from '@/components/workout/WorkoutRestTimerWidget.vue'
import WorkoutSetTable from '@/components/workout/WorkoutSetTable.vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
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
      v-if="selectedExercise"
      :exercise-name="selectedExercise.name"
      :equipment="selectedExercise.equipment"
      :target-reps="selectedExercise.targetReps"
      @delete="removeExercise(selectedExercise.id)"
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
      <template v-if="selectedExercise">
        <!-- Sets Table -->
        <WorkoutSetTable
          :sets="selectedExercise.sets"
          @toggle-complete="toggleSetComplete"
        />

        <!-- Previous History -->
        <WorkoutPreviousHistory :sets="selectedExercise.sets" />
      </template>

      <!-- Empty State -->
      <Empty v-else class="animate-in fade-in-50 duration-500 h-full border-0">
        <EmptyContent>
          <EmptyMedia variant="icon" class="bg-primary/10 text-primary">
            <Dumbbell class="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Start Your Workout</EmptyTitle>
            <EmptyDescription>
              Add exercises to begin tracking your sets and progress.
            </EmptyDescription>
          </EmptyHeader>
          <Button class="gap-2" @click="showAddExercise = true">
            <Plus class="size-4" />
            Add First Exercise
          </Button>
        </EmptyContent>
      </Empty>
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
