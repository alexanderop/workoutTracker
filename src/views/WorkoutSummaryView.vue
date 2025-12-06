<script setup lang="ts">
import { Trophy, Clock, Dumbbell, Target, Flame, Repeat } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import WorkoutSaveTemplateDialog from '@/features/workout/components/WorkoutSaveTemplateDialog.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAnimatedCounter } from '@/composables/useAnimatedCounter'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { useWorkoutDetail } from '@/features/workout/composables/useWorkoutDetail'
import { templatesRepository } from '@/db/repositories/templates'
import { formatDuration, formatWeight } from '@/lib/formatters'
import { formatWeight as formatWeightUnit, WEIGHT_UNIT_LABELS } from '@/lib/unitConversion'
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

// Animated counters with staggered delays
const { displayValue: animatedExercises } = useAnimatedCounter(() => stats.value.exerciseCount, {
  delay: 600,
  duration: 1200,
})
const { displayValue: animatedSets } = useAnimatedCounter(() => stats.value.setCount, {
  delay: 750,
  duration: 1200,
})
const { displayValue: animatedWeight } = useAnimatedCounter(
  () => {
    const kg = stats.value.totalWeight
    const decimals = settingsStore.weightUnit === 'lbs' ? 1 : 0
    return Number.parseFloat(formatWeightUnit(kg, settingsStore.weightUnit, decimals))
  },
  {
    delay: 900,
    duration: 1500,
  },
)
const { displayValue: animatedRounds } = useAnimatedCounter(() => stats.value.totalRounds, {
  delay: 1050,
  duration: 1200,
})

const hasTimedBlocks = computed(() => stats.value.timedBlockCount > 0)
const hasStrengthBlocks = computed(() => stats.value.exerciseCount > 0)

const workoutName = computed(() => {
  return state.value.status === 'success' ? state.value.workout.name : ''
})

function weightLabel(): string {
  return `${WEIGHT_UNIT_LABELS[settingsStore.weightUnit]} lifted`
}

// Save as Template state
const showSaveTemplateDialog = ref(false)
const isSavingTemplate = ref(false)

async function handleSaveAsTemplate(name: string): Promise<void> {
  if (state.value.status !== 'success' || isSavingTemplate.value) return

  isSavingTemplate.value = true
  await tryCatch(templatesRepository.createFromCompletedWorkout(state.value.workout, name))
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
        <h1 class="text-3xl font-bold tracking-tight mb-2">{{ t('workouts.summary.title') }}</h1>
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
            <Clock class="w-5 h-5 text-muted-foreground" />
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
            <Dumbbell class="w-5 h-5 text-muted-foreground" />
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
            <Repeat class="w-5 h-5 text-muted-foreground" />
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
            <Target class="w-5 h-5 text-muted-foreground" />
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
            <Clock class="w-5 h-5 text-muted-foreground" />
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
            <Flame class="w-5 h-5 text-muted-foreground" />
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
          class="flex-1 h-12 text-base font-semibold"
          size="lg"
          @click="showSaveTemplateDialog = true"
        >
          {{ t('workouts.summary.button.saveTemplate') }}
        </Button>
        <Button class="flex-1 h-12 text-base font-semibold" size="lg" @click="handleDone">
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
