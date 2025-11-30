<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { workoutsRepository } from '@/db/repositories/workouts'
import type { DbCompletedWorkout } from '@/db/schema'
import { formatDate, formatDuration } from '@/lib/formatters'

const router = useRouter()

const workouts = ref<ReadonlyArray<DbCompletedWorkout>>([])
const isLoading = ref(true)

onMounted(async () => {
  workouts.value = await workoutsRepository.getHistory()
  isLoading.value = false
})

function navigateToWorkoutDetail(workoutId: string): void {
  router.push(`/workouts/${workoutId}`)
}

function handleKeyDown(event: KeyboardEvent, workoutId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    navigateToWorkoutDetail(workoutId)
  }
}
</script>

<template>
  <div class="flex-1 p-4">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="text-3xl font-bold mb-2">Workouts</h1>
        <p class="text-muted-foreground">View and manage your workouts</p>
      </CardContent>
    </Card>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <!-- Workout list -->
    <div v-else-if="workouts.length > 0" class="grid gap-3">
      <Card
        v-for="workout in workouts"
        :key="workout.id"
        role="button"
        tabindex="0"
        class="p-4 cursor-pointer hover:bg-accent transition-colors"
        @click="navigateToWorkoutDetail(workout.id)"
        @keydown="handleKeyDown($event, workout.id)"
      >
        <div class="flex justify-between items-center">
          <div>
            <div class="font-medium">{{ workout.name }}</div>
            <div class="text-sm text-muted-foreground">{{ formatDate(workout.completedAt) }}</div>
          </div>
          <div class="text-sm text-muted-foreground tabular-nums">
            {{ formatDuration(workout.durationSeconds) }}
          </div>
        </div>
      </Card>
    </div>

    <!-- Empty state -->
    <div v-else class="grid gap-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No workouts yet</EmptyTitle>
          <EmptyDescription>Start your first workout to get started</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  </div>
</template>
