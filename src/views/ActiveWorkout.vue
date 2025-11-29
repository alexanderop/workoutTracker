<script setup lang="ts">
import { Dumbbell, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import WorkoutAddExerciseDialog from '@/components/workout/WorkoutAddExerciseDialog.vue'
import WorkoutEditExerciseDialog from '@/components/workout/WorkoutEditExerciseDialog.vue'
import WorkoutExerciseCarousel from '@/components/workout/WorkoutExerciseCarousel.vue'
import WorkoutHeader from '@/components/workout/WorkoutHeader.vue'
import WorkoutPreviousHistory from '@/components/workout/WorkoutPreviousHistory.vue'
import WorkoutRestTimerWidget from '@/components/workout/WorkoutRestTimerWidget.vue'
import WorkoutSetTable from '@/components/workout/WorkoutSetTable.vue'
import { useRestTimer } from '@/composables/useRestTimer'
import type { Set } from '@/composables/useWorkout'
import { useWorkout } from '@/composables/useWorkout'

const { workout, selectedExercise, selectExercise, completeSet, addExercise, removeExercise, updateExercise, addSet, removeSet, setSetCount, updateSetValue } = useWorkout()
const timer = useRestTimer()

const showAddExercise = ref(false)
const showEditExercise = ref(false)

function handleSetComplete(set: Set) {
  const result = completeSet(set)

  // Only start timer when completing (not un-completing)
  if (result.kind === 'completed') {
    timer.startTimer()
  }
}

function handleSaveExercise(data: { name: string, equipment: string, targetReps: number, setCount: number }) {
  if (!selectedExercise.value) return
  updateExercise(data)
  setSetCount(selectedExercise.value.id, data.setCount)
}
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
      @edit="showEditExercise = true"
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
          @toggle-complete="handleSetComplete"
          @add-set="addSet(selectedExercise.id)"
          @remove-set="removeSet(selectedExercise.id, $event)"
          @update-set="updateSetValue"
        />

        <!-- Previous History -->
        <WorkoutPreviousHistory :sets="[]" />
      </template>

      <!-- Empty State -->
      <Empty v-else class="animate-in fade-in-50 duration-500 h-full flex items-center justify-center border-0">
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
    <WorkoutAddExerciseDialog
      :open="showAddExercise"
      @update:open="showAddExercise = $event"
      @add="addExercise"
    />

    <!-- Edit Exercise Dialog -->
    <WorkoutEditExerciseDialog
      v-if="selectedExercise"
      :open="showEditExercise"
      :exercise-name="selectedExercise.name"
      :equipment="selectedExercise.equipment"
      :target-reps="selectedExercise.targetReps"
      :set-count="selectedExercise.sets.length"
      @update:open="showEditExercise = $event"
      @save="handleSaveExercise"
    />
  </div>
</template>
