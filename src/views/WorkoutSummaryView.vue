<script setup lang="ts">
import { Trophy, Clock, Dumbbell, Target, Flame, Repeat } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import WorkoutSaveTemplateDialog from '@/features/workout/components/WorkoutSaveTemplateDialog.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { useWorkoutDetail } from '@/features/workout/composables/useWorkoutDetail'
import { useSummaryStats } from '@/features/workout/composables/useSummaryStats'
import { getTemplatesRepository } from '@/db'
import { formatDuration, formatWeight } from '@/lib/formatters'
import { useSettingsStore } from '@/stores/settings'
import { tryCatch } from '@/lib/tryCatch'

const { t } = useI18n()

const { id } = defineProps<{
  id: string
}>()

const router = useRouter()
const settingsStore = useSettingsStore()
const { state, stats } = useWorkoutDetail(id)
const { isVisible: showContent } = useEnterAnimation(100)

const {
  animatedExercises,
  animatedSets,
  animatedWeight,
  animatedRounds,
  hasTimedBlocks,
  hasStrengthBlocks,
  weightLabel,
} = useSummaryStats(stats, () => settingsStore.weightUnit)

const workoutName = computed(() => {
  return state.value.status === 'success' ? state.value.workout.name : ''
})

// Save as Template state
const showSaveTemplateDialog = ref(false)
const isSavingTemplate = ref(false)

async function handleSaveAsTemplate(name: string): Promise<void> {
  if (state.value.status !== 'success' || isSavingTemplate.value) return

  isSavingTemplate.value = true
  await tryCatch(getTemplatesRepository().createFromWorkout(state.value.workout, name))
  showSaveTemplateDialog.value = false
  isSavingTemplate.value = false
}

function handleDone() {
  router.push({ name: RouteNames.Home })
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
    <div v-if="state.status === 'loading'" class="flex-1 flex items-center justify-center">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Content -->
    <div
      v-else-if="state.status === 'success'"
      class="flex-1 flex flex-col items-center justify-center p-6 gap-8"
    >
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
        <h1 class="text-page-title font-bold tracking-tight mb-2">
          {{ t('workouts.summary.title') }}
        </h1>
        <p class="text-muted-foreground text-lg">
          {{ workoutName }}
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
            <Clock class="icon-md text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ formatDuration(stats.duration) }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {{ t('workouts.summary.stats.duration') }}
          </div>
        </Card>

        <!-- Exercises (only if strength blocks exist) -->
        <Card
          v-if="hasStrengthBlocks"
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '500ms' }"
        >
          <div class="flex justify-center mb-2">
            <Dumbbell class="icon-md text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ animatedExercises }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {{ t('workouts.summary.stats.exercises') }}
          </div>
        </Card>

        <!-- Rounds (only if timed blocks with rounds exist) -->
        <Card
          v-if="hasTimedBlocks && stats.totalRounds > 0"
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '500ms' }"
        >
          <div class="flex justify-center mb-2">
            <Repeat class="icon-md text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ animatedRounds }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {{ t('workouts.summary.stats.rounds') }}
          </div>
        </Card>

        <!-- Sets (only if strength blocks exist) -->
        <Card
          v-if="hasStrengthBlocks"
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '600ms' }"
        >
          <div class="flex justify-center mb-2">
            <Target class="icon-md text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ animatedSets }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {{ t('workouts.summary.stats.sets') }}
          </div>
        </Card>

        <!-- Timed Blocks Count -->
        <Card
          v-if="hasTimedBlocks"
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '600ms' }"
        >
          <div class="flex justify-center mb-2">
            <Clock class="icon-md text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ stats.timedBlockCount }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {{ t('workouts.summary.stats.timedBlocks') }}
          </div>
        </Card>

        <!-- Total Weight (only if strength blocks exist) -->
        <Card
          v-if="hasStrengthBlocks"
          class="p-4 text-center border-0 bg-secondary/50"
          :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
          :style="{ animationDelay: '700ms' }"
        >
          <div class="flex justify-center mb-2">
            <Flame class="icon-md text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono text-primary tabular-nums">
            {{ formatWeight(animatedWeight) }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {{ weightLabel() }}
          </div>
        </Card>
      </div>
    </div>

    <!-- Not found state -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <p class="text-muted-foreground mb-4">{{ t('workouts.detail.notFound') }}</p>
        <Button @click="handleDone">{{ t('common.buttons.goHome') }}</Button>
      </div>
    </div>

    <!-- Action buttons -->
    <div
      v-if="state.status === 'success'"
      class="p-4 safe-area-bottom space-y-3"
      :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '1000ms' }"
    >
      <div class="flex gap-3">
        <Button
          variant="outline"
          class="flex-1 h-touch text-base font-semibold"
          size="lg"
          @click="showSaveTemplateDialog = true"
        >
          {{ t('workouts.summary.button.saveTemplate') }}
        </Button>
        <Button class="flex-1 h-touch text-base font-semibold" size="lg" @click="handleDone">
          {{ t('workouts.summary.button.done') }}
        </Button>
      </div>
    </div>

    <!-- Save as Template Dialog -->
    <WorkoutSaveTemplateDialog
      v-model:open="showSaveTemplateDialog"
      :initial-name="workoutName"
      :is-saving="isSavingTemplate"
      @confirm="handleSaveAsTemplate"
    />
  </div>
</template>
