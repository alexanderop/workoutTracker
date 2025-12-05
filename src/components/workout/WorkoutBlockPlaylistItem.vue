<script setup lang="ts">
import { GripVertical, Pencil, Trash2 } from 'lucide-vue-next'
import { motion } from 'motion-v'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import {
  BLOCK_COLORS,
  BLOCK_LABELS,
  getBlockDurationDisplay,
  getBlockThumbnail,
  isStrengthBlock,
  isTimedBlock,
} from '@/types/blocks'
import { useSwipeToReveal } from '@/composables/useSwipeToReveal'

type Props = {
  block: WorkoutBlock
  isSelected: boolean
  isCompleted?: boolean
  showConnector?: boolean
  disabled?: boolean
}

const {
  block,
  isSelected,
  isCompleted = false,
  showConnector = true,
  disabled = false,
} = defineProps<Props>()

const emit = defineEmits<{
  select: []
  edit: []
  remove: []
}>()

const { t } = useI18n()

// Swipe-to-reveal state
const {
  x,
  setContainerRef,
  isTouchDevice,
  BUTTON_WIDTH,
  REVEAL_WIDTH,
  closeSwipe,
  handleDragEnd,
} = useSwipeToReveal(() => block.id)

function handleEdit() {
  closeSwipe()
  emit('edit')
}

function handleRemove() {
  closeSwipe()
  emit('remove')
}

const blockColors = computed(() => BLOCK_COLORS[block.kind])
const thumbnail = computed(() => getBlockThumbnail(block))
const label = computed(() => BLOCK_LABELS[block.kind])

const subtitle = computed(() => {
  if (isStrengthBlock(block)) {
    return `${block.equipment} · ${block.sets.length} sets`
  }
  if (isTimedBlock(block)) {
    return getBlockDurationDisplay(block)
  }
  return ''
})

const completedSets = computed(() => {
  if (!isStrengthBlock(block)) return null
  const completed = block.sets.filter((s) => s.status === 'completed').length
  return `${completed}/${block.sets.length}`
})
</script>

<template>
  <div class="relative flex">
    <!-- Timeline connector -->
    <div
      v-if="showConnector"
      class="absolute left-7 top-[64px] w-0.5 h-4 bg-border"
      aria-hidden="true"
    />

    <!-- Main item with swipe -->
    <div
      :ref="setContainerRef"
      class="flex-1 relative overflow-hidden rounded-lg"
      :class="disabled && 'pointer-events-none opacity-50'"
    >
      <!-- Swipe action buttons (positioned behind content, touch only) -->
      <div
        v-if="isTouchDevice && !disabled"
        class="absolute right-0 inset-y-0 flex items-stretch"
      >
        <button
          v-if="isStrengthBlock(block)"
          class="bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          :style="{ width: `${BUTTON_WIDTH}px` }"
          :aria-label="t('common.edit')"
          @click="handleEdit"
        >
          <Pencil class="w-5 h-5 text-foreground" />
        </button>
        <button
          class="bg-destructive flex items-center justify-center hover:bg-destructive/90 transition-colors"
          :style="{ width: `${BUTTON_WIDTH}px` }"
          :aria-label="t('common.delete')"
          @click="handleRemove"
        >
          <Trash2 class="w-5 h-5 text-white" />
        </button>
      </div>

      <!-- Swipeable content -->
      <!-- eslint-disable-next-line vue/component-name-in-template-casing -->
      <motion.div
        :drag="isTouchDevice ? 'x' : false"
        :drag-constraints="{ left: -REVEAL_WIDTH, right: 0 }"
        :drag-elastic="0.1"
        :style="{ x }"
        :class="
          cn(
            'relative flex items-center gap-3 p-3 min-h-[64px] bg-background cursor-pointer',
            'border border-transparent transition-[border-color,background-color]',
            isSelected && 'border-primary bg-primary/5',
            isCompleted && 'opacity-60',
          )
        "
        role="button"
        tabindex="0"
        :aria-pressed="isSelected"
        @drag-end="handleDragEnd"
        @click="emit('select')"
        @keydown.enter="emit('select')"
        @keydown.space.prevent="emit('select')"
      >
        <!-- Drag handle -->
        <div
          class="flex-shrink-0 cursor-grab active:cursor-grabbing touch-manipulation drag-handle"
          :class="disabled && 'opacity-0'"
          @pointerdown.stop
        >
          <GripVertical class="w-5 h-5 text-muted-foreground" />
        </div>

        <!-- Block icon -->
        <div
          :class="
            cn(
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl',
              blockColors.bg,
            )
          "
        >
          {{ thumbnail }}
        </div>

        <!-- Block info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">
              {{ isStrengthBlock(block) ? block.name : label }}
            </span>
            <span
              v-if="isTimedBlock(block)"
              :class="cn('text-xs px-1.5 py-0.5 rounded', blockColors.bg, blockColors.text)"
            >
              {{ block.kind.toUpperCase() }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground truncate">
            {{ subtitle }}
          </p>
        </div>

        <!-- Progress/status -->
        <div v-if="completedSets" class="flex-shrink-0 text-sm text-muted-foreground">
          {{ completedSets }}
        </div>

        <!-- Desktop action buttons (non-touch devices) -->
        <div v-if="!isTouchDevice && !disabled" class="flex-shrink-0 flex items-center gap-1">
          <button
            v-if="isStrengthBlock(block)"
            class="p-1.5 rounded hover:bg-muted transition-colors"
            :aria-label="t('common.edit')"
            @click.stop="handleEdit"
          >
            <Pencil class="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            class="p-1.5 rounded hover:bg-destructive/10 transition-colors"
            :aria-label="t('common.delete')"
            @click.stop="handleRemove"
          >
            <Trash2 class="w-4 h-4 text-destructive" />
          </button>
        </div>
      </motion.div>
    </div>
  </div>
</template>
