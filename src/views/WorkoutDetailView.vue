<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Copy, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import PageLayout from '@/components/PageLayout.vue'
import WorkoutDetailExerciseCard from '@/features/workout/components/WorkoutDetailExerciseCard.vue'
import WorkoutDetailStatsRow from '@/features/workout/components/WorkoutDetailStatsRow.vue'
import TimedBlockCard from '@/features/workout/components/TimedBlockCard.vue'
import ErrorDialog from '@/components/ErrorDialog.vue'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { useWorkoutDetail } from '@/features/workout/composables/useWorkoutDetail'
import { formatDate } from '@/lib/formatters'
import { getWorkoutsRepository } from '@/db'
import { useAppInitialization } from '@/features/workout/composables/useAppInitialization'
import { tryCatch } from '@/lib/tryCatch'
import { exportWorkoutAsMarkdown } from '@/features/workout/utils/markdownExport'

const { t } = useI18n()

const { id } = defineProps<{
  id: string
}>()

const router = useRouter()
const { state, stats } = useWorkoutDetail(id)
const { isVisible: showContent } = useEnterAnimation(100)
const { resumeWorkout } = useAppInitialization()

const isRedoing = ref(false)
const showRedoError = ref(false)
const isCopied = ref(false)

async function handleRedoWorkout() {
  if (isRedoing.value) return

  isRedoing.value = true
  const [error] = await tryCatch(getWorkoutsRepository().startFromCompleted(id))
  if (error) {
    showRedoError.value = true
    isRedoing.value = false
    return
  }
  await resumeWorkout()
}

async function handleCopyMarkdown() {
  if (state.value.status !== 'success') return

  const markdown = exportWorkoutAsMarkdown(state.value.workout)
  await navigator.clipboard.writeText(markdown)

  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}
</script>

<template>
  <PageLayout
    :title="state.status === 'success' ? state.workout.name : t('workouts.detail.title')"
    :subtitle="state.status === 'success' ? formatDate(state.workout.startedAt) : undefined"
    back-to="/"
  >
    <template v-if="state.status === 'success'" #header-actions>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="isCopied ? t('workouts.detail.copy.success') : t('workouts.detail.copy.button')"
        @click="handleCopyMarkdown"
      >
        <Check v-if="isCopied" class="icon-sm text-green-500" />
        <Copy v-else class="icon-sm" />
      </Button>
      <span v-if="isCopied" class="text-sm text-green-500">{{ t('workouts.detail.copy.success') }}</span>
    </template>

    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex items-center justify-center py-16">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Workout details -->
    <div v-else-if="state.status === 'success'" class="flex flex-col">
      <!-- Stats row -->
      <WorkoutDetailStatsRow
        :stats="stats"
        :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
        :style="{ animationDelay: '100ms' }"
      />

      <!-- Blocks list -->
      <div class="flex-1 space-y-3 p-4">
        <template v-for="(block, index) in state.workout.blocks" :key="block.id">
          <WorkoutDetailExerciseCard
            v-if="block.kind === 'strength'"
            :exercise="block"
            :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
            :style="{ animationDelay: `${150 + index * 50}ms` }"
          />
          <!-- Cardio block display -->
          <div
            v-else-if="block.kind === 'cardio'"
            class="rounded-lg border bg-card p-4"
            :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
            :style="{ animationDelay: `${150 + index * 50}ms` }"
          >
            <div class="font-semibold uppercase">{{ t('workouts.blocks.cardio') }}</div>
            <div v-if="block.result" class="mt-1 text-sm text-muted-foreground">
              {{ Math.floor(block.result.actualDurationSeconds / 60) }} {{ t('workouts.detail.minutesCompleted') }}
            </div>
          </div>
          <TimedBlockCard
            v-else
            :block="block"
            :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
            :style="{ animationDelay: `${150 + index * 50}ms` }"
          />
        </template>
      </div>

      <!-- Notes section if available -->
      <div
        v-if="state.workout.notes"
        class="border-t px-4 py-4"
        :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
        :style="{ animationDelay: '300ms' }"
      >
        <h2 class="mb-2 text-sm font-medium text-muted-foreground">
          {{ t('workouts.detail.notes') }}
        </h2>
        <p class="text-sm">{{ state.workout.notes }}</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="state.status === 'error'"
      class="flex flex-col items-center justify-center py-16"
    >
      <p class="mb-4 text-muted-foreground">{{ t('workouts.detail.error') }}</p>
      <Button variant="outline" @click="router.push('/')">{{
        t('workouts.detail.goBack')
      }}</Button>
    </div>

    <!-- Not found state -->
    <div v-else class="flex flex-col items-center justify-center py-16">
      <p class="mb-4 text-muted-foreground">{{ t('workouts.detail.notFound') }}</p>
      <Button variant="outline" @click="router.push('/')">{{
        t('workouts.detail.goBack')
      }}</Button>
    </div>

    <template v-if="state.status === 'success'" #footer>
      <div class="p-4">
        <Button class="w-full" size="lg" :disabled="isRedoing" @click="handleRedoWorkout">
          {{ isRedoing ? t('workouts.redo.starting') : t('workouts.redo.button') }}
        </Button>
      </div>
    </template>

    <ErrorDialog
      v-model:open="showRedoError"
      :error="t('workouts.redo.error.message')"
      :title="t('workouts.redo.error.title')"
    />
  </PageLayout>
</template>
