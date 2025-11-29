<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { workoutsRepository } from '@/db/repositories/workouts'
import type { DbCompletedWorkout } from '@/db/schema'

const workouts = ref<ReadonlyArray<DbCompletedWorkout>>([])
const isLoading = ref(true)

onMounted(async () => {
  workouts.value = await workoutsRepository.getHistory()
  isLoading.value = false
})

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="flex-1 p-4">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="text-3xl font-bold mb-2">
          Workouts
        </h1>
        <p class="text-muted-foreground">
          View and manage your workouts
        </p>
      </CardContent>
    </Card>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-8"
    >
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <!-- Workout list -->
    <div
      v-else-if="workouts.length > 0"
      class="grid gap-3"
    >
      <Card
        v-for="workout in workouts"
        :key="workout.id"
        class="p-4"
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
    <div
      v-else
      class="grid gap-4"
    >
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No workouts yet</EmptyTitle>
          <EmptyDescription>Start your first workout to get started</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  </div>
</template>
