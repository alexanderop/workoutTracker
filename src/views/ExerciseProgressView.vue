<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { useExerciseProgress } from '@/exercises/useExerciseProgress'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import ExerciseProgressPRCards from '@/exercises/ui/ExerciseProgressPRCards.vue'
import ExerciseProgressChart from '@/exercises/ui/ExerciseProgressChart.vue'
import ExerciseProgressEmpty from '@/exercises/ui/ExerciseProgressEmpty.vue'
import { RouteNames } from '@/router'

const { t } = useI18n()
const router = useRouter()

const { id } = defineProps<{
  id: string
}>()

const { state, chartData, hasHistory, exerciseName, personalRecords } = useExerciseProgress(id)
const { isVisible: showContent } = useEnterAnimation(100)

function handleEditExercise() {
  router.push({ name: RouteNames.EditExercise, params: { id } })
}
</script>

<template>
  <PageLayout :title="exerciseName || t('exercises.progress.title')" back-to="/exercises">
    <template #header-actions>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('exercises.edit.title')"
        @click="handleEditExercise"
      >
        <Pencil class="size-5" />
      </Button>
    </template>

    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex items-center justify-center py-16">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Error state -->
    <div v-else-if="state.status === 'error'" class="flex items-center justify-center py-16">
      <div class="text-destructive">{{ t('common.states.error') }}</div>
    </div>

    <!-- Not found state -->
    <div v-else-if="state.status === 'not-found'" class="flex items-center justify-center py-16">
      <div class="text-muted-foreground">{{ t('exercises.progress.notFound') }}</div>
    </div>

    <!-- Success state -->
    <template v-else-if="state.status === 'success'">
      <!-- Empty state - no workout history -->
      <ExerciseProgressEmpty
        v-if="!hasHistory"
        :exercise-name="exerciseName"
        :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
      />

      <!-- Progress data -->
      <div v-else class="flex flex-col gap-6 p-4">
        <!-- PR Cards -->
        <ExerciseProgressPRCards
          v-if="personalRecords"
          :personal-records="personalRecords"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '50ms' }"
        />

        <!-- Charts -->
        <div class="space-y-4">
          <ExerciseProgressChart
            :data="chartData"
            :title="t('exercises.progress.charts.maxWeight')"
            y-key="maxWeight"
            color="var(--chart-1)"
            :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
            :style="{ animationDelay: '100ms' }"
          />

          <ExerciseProgressChart
            :data="chartData"
            :title="t('exercises.progress.charts.estimated1RM')"
            y-key="estimated1RM"
            color="var(--chart-2)"
            :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
            :style="{ animationDelay: '150ms' }"
          />

          <ExerciseProgressChart
            :data="chartData"
            :title="t('exercises.progress.charts.volume')"
            y-key="volume"
            color="var(--chart-3)"
            :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
            :style="{ animationDelay: '200ms' }"
          />
        </div>
      </div>
    </template>
  </PageLayout>
</template>
