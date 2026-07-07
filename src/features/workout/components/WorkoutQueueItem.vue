<script setup lang="ts">
import { Check, ChevronDown, ChevronUp, GripVertical, X } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import {
  BLOCK_COLORS,
  BLOCK_LABELS,
  getBlockExerciseList,
  getBlockImage,
  getBlockName,
  isStrengthBlock,
  isTimedBlock,
} from '@/types/blocks'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import { Button } from '@/components/ui/button'

type Properties = {
  block: WorkoutBlock
  status: 'completed' | 'active' | 'planned'
  index: number
  /** Disables the move-up button -- there's nothing above the first item. */
  isFirst?: boolean
  /** Disables the move-down button -- there's nothing below the last item. */
  isLast?: boolean
}

const { block, status, index, isFirst = false, isLast = false } = defineProps<Properties>()

const emit = defineEmits<{
  select: []
  remove: []
  // Keyboard/screen-reader-accessible reordering alongside the existing
  // pointer-only drag handle -- see Finding "No way to reorder exercises in the
  // workout queue drawer", July 2026 UX review.
  'move-up': []
  'move-down': []
}>()

const { t } = useI18n()

const blockColors = computed(() => BLOCK_COLORS[block.kind])
const blockImage = computed(() => getBlockImage(block))
const exerciseName = computed(() => getBlockName(block))

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
    <ExerciseAvatar :name="exerciseName" :image="blockImage" size="md" />

    <!-- Block info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium truncate">{{ blockName }}</span>
        <span
          v-if="isTimedBlock(block)"
          :class="cn('text-xs px-1.5 py-0.5 rounded', blockColors.bg, blockColors.text)"
        >
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

    <!-- Move up/down: keyboard/screen-reader-accessible reordering, complementing
         the pointer-only drag handle above. -->
    <div class="flex-shrink-0 flex flex-col">
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-muted-foreground hover:text-foreground"
        :disabled="isFirst"
        :aria-label="t('workouts.active.queue.moveUp', { name: blockName })"
        @click.stop="emit('move-up')"
      >
        <ChevronUp class="icon-sm" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-muted-foreground hover:text-foreground"
        :disabled="isLast"
        :aria-label="t('workouts.active.queue.moveDown', { name: blockName })"
        @click.stop="emit('move-down')"
      >
        <ChevronDown class="icon-sm" aria-hidden="true" />
      </Button>
    </div>

    <!-- Remove button -->
    <Button
      variant="ghost"
      size="icon-sm"
      class="flex-shrink-0 text-muted-foreground hover:text-destructive"
      :aria-label="t('common.aria.removeBlock', { name: blockName })"
      @click.stop="emit('remove')"
    >
      <X class="icon-sm" aria-hidden="true" />
    </Button>
  </div>
</template>
