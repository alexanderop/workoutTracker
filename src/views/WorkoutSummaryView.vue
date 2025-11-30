<script setup lang="ts">
import { Trophy, Clock, Dumbbell, Target, Flame } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAnimatedCounter } from '@/composables/useAnimatedCounter'
import { workoutsRepository } from '@/db/repositories/workouts'
import type { DbCompletedWorkout } from '@/db/schema'

const { id } = defineProps<{
  id: string
}>()

const router = useRouter()
const workout = ref<DbCompletedWorkout | null>(null)
const isLoading = ref(true)
const showContent = ref(false)

onMounted(async () => {
  const data = await workoutsRepository.getById(id)
  workout.value = data ?? null
  isLoading.value = false

  // Trigger staggered animations after a brief delay
  setTimeout(() => {
    showContent.value = true
  }, 100)
})

const stats = computed(() => {
  if (!workout.value) {
    return { duration: 0, exerciseCount: 0, setCount: 0, totalWeight: 0 }
  }

  const completedSets = workout.value.exercises.flatMap((e) =>
    e.sets.filter((s) => s.status === 'completed'),
  )

  const totalWeight = completedSets.reduce((sum, set) => {
    const kg = Number.parseFloat(set.kg) || 0
    const reps = Number.parseFloat(set.reps) || 0
    return sum + kg * reps
  }, 0)

  return {
    duration: workout.value.durationSeconds,
    exerciseCount: workout.value.exercises.length,
    setCount: completedSets.length,
    totalWeight: Math.round(totalWeight),
  }
})

// Animated counters with staggered delays
const { displayValue: animatedExercises } = useAnimatedCounter(() => stats.value.exerciseCount, {
  delay: 600,
  duration: 1200,
})
const { displayValue: animatedSets } = useAnimatedCounter(() => stats.value.setCount, {
  delay: 750,
  duration: 1200,
})
const { displayValue: animatedWeight } = useAnimatedCounter(() => stats.value.totalWeight, {
  delay: 900,
  duration: 1500,
})

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)}k`
  }
  return weight.toLocaleString()
}

function handleDone() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
    <!-- Confetti particles -->
    <div
      v-if="showContent"
      class="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        v-for="i in 20"
        :key="i"
        class="absolute w-3 h-3 rounded-sm animate-confetti-fall"
        :class="[
          i % 5 === 0 ? 'bg-primary' : '',
          i % 5 === 1 ? 'bg-chart-1' : '',
          i % 5 === 2 ? 'bg-chart-2' : '',
          i % 5 === 3 ? 'bg-chart-4' : '',
          i % 5 === 4 ? 'bg-chart-5' : '',
        ]"
        :style="{
          left: `${(i * 5) % 100}%`,
          animationDelay: `${i * 0.1}s`,
          animationDuration: `${2 + (i % 3)}s`,
        }"
      />
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <!-- Content -->
    <div v-else-if="workout" class="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      <!-- Trophy icon with bounce animation -->
      <div class="relative" :class="showContent ? 'animate-bounce-in' : 'opacity-0'">
        <div class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy class="w-12 h-12 text-primary" />
        </div>
        <!-- Glow effect -->
        <div class="absolute inset-0 w-24 h-24 rounded-full bg-primary/10 blur-xl -z-10" />
      </div>

      <!-- Title -->
      <div
        class="text-center"
        :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
        :style="{ animationDelay: '200ms' }"
      >
        <h1 class="text-3xl font-bold tracking-tight mb-2">Workout Complete!</h1>
        <p class="text-muted-foreground text-lg">
          {{ workout.name }}
        </p>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
        <!-- Duration -->
        <Card
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '400ms' }"
        >
          <div class="flex justify-center mb-2">
            <Clock class="w-5 h-5 text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ formatDuration(stats.duration) }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">Duration</div>
        </Card>

        <!-- Exercises -->
        <Card
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '500ms' }"
        >
          <div class="flex justify-center mb-2">
            <Dumbbell class="w-5 h-5 text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ animatedExercises }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">Exercises</div>
        </Card>

        <!-- Sets -->
        <Card
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '600ms' }"
        >
          <div class="flex justify-center mb-2">
            <Target class="w-5 h-5 text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ animatedSets }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">Sets</div>
        </Card>

        <!-- Total Weight -->
        <Card
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '700ms' }"
        >
          <div class="flex justify-center mb-2">
            <Flame class="w-5 h-5 text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ formatWeight(animatedWeight) }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">kg lifted</div>
        </Card>
      </div>
    </div>

    <!-- Not found state -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <p class="text-muted-foreground mb-4">Workout not found</p>
        <Button @click="handleDone"> Go Home </Button>
      </div>
    </div>

    <!-- Done button -->
    <div
      v-if="workout && !isLoading"
      class="p-4 safe-area-bottom"
      :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '1000ms' }"
    >
      <Button class="w-full h-12 text-base font-semibold" size="lg" @click="handleDone">
        Done
      </Button>
    </div>
  </div>
</template>
