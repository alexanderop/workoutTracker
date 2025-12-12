<script setup lang="ts">
import { Check, GripVertical } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import {
  BLOCK_COLORS,
  BLOCK_LABELS,
  getBlockExerciseList,
  getBlockThumbnail,
  isStrengthBlock,
  isTimedBlock,
} from '@/types/blocks'

type Props = {
  block: WorkoutBlock
  status: 'completed' | 'active' | 'planned'
  index: number
}

const { block, status, index } = defineProps<Props>()

const emit = defineEmits<{
  select: []
}>()

const { t } = useI18n()

const blockColors = computed(() => BLOCK_COLORS[block.kind])
const thumbnail = computed(() => getBlockThumbnail(block))

const blockName = computed(() => {
  if (isStrengthBlock(block)) {
    return block.name
  }
  return BLOCK_LABELS[block.kind]
})

const subtitle = computed(() => {
  if (isStrengthBlock(block)) {
    const completedSets = block.sets.filter((s) => s.status === 'completed').length
    return `${completedSets}/${block.sets.length} sets`
  }
  if (isTimedBlock(block)) {
    const exercises = getBlockExerciseList(block)
    return t('workouts.active.queue.exercises', { count: exercises.length })
  }
  return ''
})

const isActive = computed(() => status === 'active')
const isCompleted = computed(() => status === 'completed')
</script>

<template>
  <div
    data-queue-item
    :class="
      cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer',
        'hover:bg-accent/50',
        isActive && 'bg-primary/10 border border-primary',
        isCompleted && 'opacity-60',
      )
    "
    role="button"
    tabindex="0"
    @click="emit('select')"
    @keydown.enter="emit('select')"
    @keydown.space.prevent="emit('select')"
  >
    <!-- Drag handle -->
    <div class="flex-shrink-0 cursor-grab active:cursor-grabbing touch-manipulation drag-handle">
      <GripVertical class="icon-md text-muted-foreground" aria-hidden="true" />
    </div>

    <!-- Block number -->
    <div class="flex-shrink-0 w-6 text-center text-sm font-medium text-muted-foreground">
      {{ index + 1 }}
    </div>

    <!-- Block icon -->
    <div
      :class="
        cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl', blockColors.bg)
      "
    >
      {{ thumbnail }}
    </div>

    <!-- Block info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium truncate">{{ blockName }}</span>
        <span v-if="isTimedBlock(block)" :class="cn('text-xs px-1.5 py-0.5 rounded', blockColors.bg, blockColors.text)">
          {{ block.kind.toUpperCase() }}
        </span>
        <span v-if="isActive" class="text-xs text-primary font-medium">
          {{ t('workouts.active.queue.active') }}
        </span>
      </div>
      <p class="text-sm text-muted-foreground truncate">
        {{ subtitle }}
      </p>
    </div>

    <!-- Completed indicator -->
    <div
      v-if="isCompleted"
      class="flex-shrink-0"
      role="img"
      :aria-label="t('common.aria.blockCompleted')"
    >
      <Check class="icon-md status-success" aria-hidden="true" />
    </div>
  </div>
</template>
