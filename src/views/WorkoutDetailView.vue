<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useWorkoutDetail } from '@/composables/useWorkoutDetail'

const { id } = defineProps<{
  id: string
}>()

const { state } = useWorkoutDetail(id)
</script>

<template>
  <div class="flex-1 p-4">
    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex items-center justify-center py-8">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <!-- Workout details -->
    <div v-else-if="state.status === 'success'">
      <!-- Workout name -->
      <h1 class="text-3xl font-bold mb-6">{{ state.workout.name }}</h1>

      <!-- Exercises list -->
      <div class="grid gap-4">
        <Card v-for="exercise in state.workout.exercises" :key="exercise.id">
          <CardHeader>
            <h2 class="text-xl font-semibold">{{ exercise.name }}</h2>
          </CardHeader>
          <CardContent>
            <!-- Sets table -->
            <div class="space-y-2">
              <div v-for="set in exercise.sets" :key="set.id" class="flex gap-4 text-sm">
                <span>{{ set.kg }}</span>
                <span>{{ set.reps }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="state.status === 'error'" class="flex items-center justify-center py-8">
      <div class="text-muted-foreground">Error loading workout</div>
    </div>

    <!-- Not found state -->
    <div v-else class="flex items-center justify-center py-8">
      <div class="text-muted-foreground">Workout not found</div>
    </div>
  </div>
</template>
