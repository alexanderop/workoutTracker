<script setup lang="ts">
import { Check, Maximize2, Play } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import type { TimedBlock } from '@/types/blocks'
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  getBlockDurationDisplay,
  getBlockExerciseList,
} from '@/types/blocks'

const { t } = useI18n()

type Properties = {
  block: TimedBlock
  isActive: boolean
  isRunning: boolean
}

const { block, isActive, isRunning } = defineProps<Properties>()

const emit = defineEmits<{
  start: []
  'increment-round': []
  'toggle-exercise': [exerciseId: string]
  'expand-focus': []
}>()

const exercises = computed(() => getBlockExerciseList(block))

const durationDisplay = computed(() => getBlockDurationDisplay(block))

const blockIcon = computed(() => BLOCK_ICONS[block.kind])

const blockLabel = computed(() => BLOCK_LABELS[block.kind])

// For AMRAP - show current round count
const roundCount = computed(() => {
  if (block.kind === 'amrap' && block.result) {
    return block.result.rounds
  }
  return 0
})

const roundsLabel = computed(() => t('workouts.builder.timedCard.rounds'))
</script>

<template>
  <Card class="border-0 bg-secondary/30">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ blockIcon }}</span>
          <CardTitle class="text-lg">{{ blockLabel }}</CardTitle>
        </div>
        <Badge variant="secondary" class="font-mono">
          {{ durationDisplay }}
        </Badge>
      </div>
    </CardHeader>

    <Separator class="mx-4" />

    <CardContent class="pt-4">
      <!-- Exercise List -->
      <div class="space-y-2 max-h-48 overflow-y-auto">
        <div
          v-for="exercise in exercises"
          :key="exercise.id"
          class="flex items-center justify-between py-2"
        >
          <div class="flex items-center gap-3">
            <ExerciseAvatar :name="exercise.name" :image="exercise.image" size="md" />
            <div>
              <p class="font-medium">{{ exercise.name }}</p>
              <p class="text-sm text-muted-foreground">
                {{ exercise.prescribedReps }} {{ t('workouts.builder.timedCard.reps') }}
                <template v-if="exercise.load"> · {{ exercise.load }} </template>
              </p>
            </div>
          </div>

          <!-- For Time: show completion checkbox -->
          <Checkbox
            v-if="block.kind === 'fortime' && isActive"
            :checked="block.result?.completionTime !== undefined"
            @update:checked="emit('toggle-exercise', exercise.id)"
          />
        </div>
      </div>

      <!-- Block-specific Stats -->
      <div v-if="isActive" class="mt-4 space-y-3">
        <!-- AMRAP: Round Counter -->
        <div
          v-if="block.kind === 'amrap'"
          class="flex items-center justify-between bg-background/50 rounded-lg p-3"
        >
          <div class="text-center flex-1">
            <div class="text-3xl font-bold text-primary">{{ roundCount }}</div>
            <div class="text-xs text-muted-foreground uppercase">{{ roundsLabel }}</div>
          </div>
          <Button
            variant="outline"
            size="lg"
            class="h-12"
            :disabled="!isRunning"
            @click="emit('increment-round')"
          >
            {{ t('workouts.builder.timedCard.plusOne') }} {{ roundsLabel }}
          </Button>
        </div>

        <!-- Tabata: Round/Rep Display -->
        <div v-if="block.kind === 'tabata' && block.result" class="bg-background/50 rounded-lg p-3">
          <div class="text-xs text-muted-foreground uppercase mb-2">
            {{ t('workouts.builder.timedCard.repsPerRound') }}
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge v-for="(reps, idx) in block.result.repsPerRound" :key="idx" variant="secondary">
              {{ t('workouts.builder.timedCard.roundLabel', { num: idx + 1 }) }}: {{ reps }}
            </Badge>
          </div>
        </div>

        <!-- For Time: Completion Indicator -->
        <div
          v-if="block.kind === 'fortime' && block.result?.completed"
          class="flex items-center gap-2 status-success-bg rounded-lg p-3"
        >
          <Check class="icon-md" aria-hidden="true" />
          <span class="font-semibold">
            {{ t('workouts.builder.timedCard.completedIn')
            }}{{ Math.floor(block.result.completionTime / 60) }}:{{
              String(block.result.completionTime % 60).padStart(2, '0')
            }}
          </span>
        </div>
      </div>

      <!-- Start Button (when not active) -->
      <Button v-if="!isActive" class="w-full mt-4" size="lg" @click="emit('start')">
        <Play class="icon-sm mr-2" aria-hidden="true" />
        {{ t('workouts.builder.timedCard.startBlock') }}
      </Button>

      <!-- Expand to Focus Mode (when active) -->
      <Button
        v-if="isActive && isRunning"
        variant="secondary"
        class="w-full mt-4"
        size="lg"
        @click="emit('expand-focus')"
      >
        <Maximize2 class="icon-sm mr-2" aria-hidden="true" />
        {{ t('workouts.builder.timedCard.focusMode') }}
      </Button>
    </CardContent>
  </Card>
</template>
