<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import PageLayout from '@/components/PageLayout.vue'
import BenchmarkExerciseCard from '@/features/benchmarks/components/BenchmarkExerciseCard.vue'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { useBenchmarkDetail } from '@/features/benchmarks/composables/useBenchmarkDetail'
import { formatBenchmarkType } from '@/lib/formatters'
import { RouteNames } from '@/router'

const { t } = useI18n()

const { id } = defineProps<{
  id: string
}>()

const router = useRouter()
const { state, isStarting, startWorkout } = useBenchmarkDetail(id)
const { isVisible: showContent } = useEnterAnimation(100)

async function handleStartWorkout() {
  const success = await startWorkout()
  if (success) {
    router.push({ name: RouteNames.ActiveWorkout })
  }
}
</script>

<template>
  <PageLayout
    :title="state.status === 'success' ? state.benchmark.name : ''"
    :subtitle="
      state.status === 'success'
        ? formatBenchmarkType(state.benchmark.type, state.benchmark.rounds)
        : undefined
    "
    back-to="/workouts"
  >
    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex items-center justify-center py-16">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Benchmark details (Athletic Editorial style) -->
    <div v-else-if="state.status === 'success'" class="flex flex-col">
      <!-- Workout type banner with bold typography -->
      <div
        class="border-b bg-muted/30 px-4 py-6"
        :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
        :style="{ animationDelay: '100ms' }"
      >
        <div class="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {{ t('workouts.benchmarks.detail.workoutStructure') }}
        </div>
        <div class="text-2xl font-bold">
          {{ formatBenchmarkType(state.benchmark.type, state.benchmark.rounds) }}
        </div>
      </div>

      <!-- Exercise list with staggered animations -->
      <div class="space-y-3 p-4">
        <BenchmarkExerciseCard
          v-for="(exercise, index) in state.benchmark.exercises"
          :key="index"
          :exercise="exercise"
          :index="index"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: `${150 + index * 50}ms` }"
        />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="state.status === 'error'" class="flex flex-col items-center justify-center py-16">
      <p class="mb-4 text-muted-foreground">{{ t('workouts.benchmarks.detail.error') }}</p>
      <Button variant="outline" @click="router.push('/workouts')">
        {{ t('workouts.detail.goBack') }}
      </Button>
    </div>

    <!-- Not found state -->
    <div v-else class="flex flex-col items-center justify-center py-16">
      <p class="mb-4 text-muted-foreground">{{ t('workouts.benchmarks.detail.notFound') }}</p>
      <Button variant="outline" @click="router.push('/workouts')">
        {{ t('workouts.detail.goBack') }}
      </Button>
    </div>

    <!-- Footer with prominent Start button -->
    <template v-if="state.status === 'success'" #footer>
      <div class="p-4">
        <Button class="w-full" size="lg" :disabled="isStarting" @click="handleStartWorkout">
          {{
            isStarting
              ? t('workouts.benchmarks.detail.starting')
              : t('workouts.benchmarks.detail.startWorkout')
          }}
        </Button>
      </div>
    </template>
  </PageLayout>
</template>
