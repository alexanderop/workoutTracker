<script setup lang="ts">
import { Dumbbell, Play, RotateCcw } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useWorkout } from '@/features/workout/composables/useWorkout'
import { useWorkoutMode } from '@/features/workout/composables/useWorkoutMode'
import { isStrengthBlock, isTimedBlock } from '@/types/blocks'
import WorkoutBlockPlaylist from './WorkoutBlockPlaylist.vue'

const { t } = useI18n()

const emit = defineEmits<{
  'add-block': []
  'edit-block': [index: number]
}>()

const { workout, selectBlock, reorderBlocks, removeBlock } = useWorkout()
const { startWorkout, hasBlocks, hasStarted } = useWorkoutMode()

function getBlockDurationSeconds(block: (typeof workout.value.blocks)[number]): number {
  if (isStrengthBlock(block)) {
    // Estimate 2-3 minutes per strength exercise set
    return block.sets.length * 150
  }

  if (!isTimedBlock(block)) {
    return 0
  }

  switch (block.kind) {
    case 'amrap':
      return block.config.durationSeconds
    case 'emom':
      return block.config.minutes * 60
    case 'tabata':
      return block.config.rounds * (block.config.workSeconds + block.config.restSeconds)
    case 'fortime':
      return block.config.timeCapSeconds ?? 600
  }
}

const estimatedDuration = computed(() => {
  const totalSeconds = workout.value.blocks.reduce(
    (acc, block) => acc + getBlockDurationSeconds(block),
    0,
  )

  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) {
    return `~${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `~${hours}h ${remainingMinutes}m`
})

const subtitle = computed(() => {
  if (!hasBlocks.value) return undefined
  const blockCount = workout.value.blocks.length
  const blockLabel = blockCount === 1 ? 'block' : 'blocks'
  return `${blockCount} ${blockLabel} · ${estimatedDuration.value}`
})

function handleSelect(index: number) {
  selectBlock(index)
}

function handleReorder(fromIndex: number, toIndex: number) {
  reorderBlocks(fromIndex, toIndex)
}

function handleEdit(index: number) {
  emit('edit-block', index)
}

function handleRemove(index: number) {
  removeBlock(index)
}

function handleStartWorkout() {
  startWorkout()
}
</script>

<template>
  <PageLayout :title="t('workouts.builder.plan')" :subtitle="subtitle" :scrollable="hasBlocks">
    <div :class="hasBlocks ? 'px-4' : 'h-full flex items-center justify-center'">
      <WorkoutBlockPlaylist
        v-if="hasBlocks"
        :blocks="workout.blocks"
        :selected-index="workout.selectedBlockIndex"
        @select="handleSelect"
        @edit="handleEdit"
        @remove="handleRemove"
        @reorder="handleReorder"
        @add-block="emit('add-block')"
      />

      <Empty v-else class="animate-in fade-in-50 duration-500 border-0">
        <EmptyContent>
          <EmptyMedia variant="icon" class="bg-primary/10 text-primary">
            <Dumbbell class="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{{ t('workouts.builder.startYourWorkout') }}</EmptyTitle>
            <EmptyDescription>
              {{ t('workouts.builder.description') }}
            </EmptyDescription>
          </EmptyHeader>
          <Button class="gap-2" @click="emit('add-block')">
            <Dumbbell class="size-4" />
            {{ t('workouts.builder.addFirstBlock') }}
          </Button>
        </EmptyContent>
      </Empty>
    </div>

    <template v-if="hasBlocks" #footer>
      <div class="px-4 pb-4 pt-2 safe-area-bottom">
        <Button
          size="lg"
          class="w-full h-14 text-lg font-semibold gap-2"
          :class="hasStarted && 'animate-pulse-ring'"
          @click="handleStartWorkout"
        >
          <RotateCcw v-if="hasStarted" class="size-5" />
          <Play v-else class="size-5" />
          {{ hasStarted ? t('workouts.resume') : t('workouts.builder.startWorkout') }}
        </Button>
      </div>
    </template>
  </PageLayout>
</template>
