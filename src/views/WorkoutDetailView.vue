<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import WorkoutDetailExerciseCard from '@/components/workout/WorkoutDetailExerciseCard.vue'
import WorkoutDetailStatsRow from '@/components/workout/WorkoutDetailStatsRow.vue'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { useWorkoutDetail } from '@/composables/useWorkoutDetail'
import { formatDate } from '@/lib/formatters'

const { id } = defineProps<{
  id: string
}>()

const router = useRouter()
const { state, stats } = useWorkoutDetail(id)
const { isVisible: showContent } = useEnterAnimation(100)

function handleBack() {
  router.push('/workouts')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex items-center justify-center py-16">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <!-- Workout details -->
    <div v-else-if="state.status === 'success'" class="flex flex-col">
      <!-- Header -->
      <header
        class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div class="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" class="shrink-0" @click="handleBack">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <div class="min-w-0 flex-1">
            <h1
              class="truncate text-xl font-semibold tracking-tight"
              :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
            >
              {{ state.workout.name }}
            </h1>
            <p
              class="text-sm text-muted-foreground"
              :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
              :style="{ animationDelay: '50ms' }"
            >
              {{ formatDate(state.workout.startedAt) }}
            </p>
          </div>
        </div>
      </header>

      <!-- Stats row -->
      <WorkoutDetailStatsRow
        :stats="stats"
        :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
        :style="{ animationDelay: '100ms' }"
      />

      <!-- Exercises list -->
      <div class="flex-1 space-y-3 p-4">
        <WorkoutDetailExerciseCard
          v-for="(exercise, index) in state.workout.exercises"
          :key="exercise.id"
          :exercise="exercise"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: `${150 + index * 50}ms` }"
        />
      </div>

      <!-- Notes section if available -->
      <div
        v-if="state.workout.notes"
        class="border-t px-4 py-4"
        :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
        :style="{ animationDelay: '300ms' }"
      >
        <h2 class="mb-2 text-sm font-medium text-muted-foreground">Notes</h2>
        <p class="text-sm">{{ state.workout.notes }}</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="state.status === 'error'"
      class="flex flex-col items-center justify-center py-16"
    >
      <p class="mb-4 text-muted-foreground">Error loading workout</p>
      <Button variant="outline" @click="handleBack">Go Back</Button>
    </div>

    <!-- Not found state -->
    <div v-else class="flex flex-col items-center justify-center py-16">
      <p class="mb-4 text-muted-foreground">Workout not found</p>
      <Button variant="outline" @click="handleBack">Go Back</Button>
    </div>
  </div>
</template>
