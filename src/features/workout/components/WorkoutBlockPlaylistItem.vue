<script setup lang="ts">
import { GripVertical, Pencil, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
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
  <div class="relative flex w-full">
    <!-- Timeline connector -->
    <div
      v-if="showConnector"
      class="absolute left-7 top-[64px] w-0.5 h-4 bg-border"
      aria-hidden="true"
    />

    <!-- Main item -->
    <div
      :class="
        cn(
          'flex-1 flex items-center gap-3 rounded-lg transition-all min-h-[64px]',
          'border border-transparent',
          isSelected && 'border-primary bg-primary/5',
          isCompleted && 'opacity-60',
          disabled && 'pointer-events-none opacity-50',
        )
      "
    >
      <!-- Selectable area -->
      <button
        type="button"
        class="flex flex-1 items-center gap-3 p-3 min-w-0 text-left"
        :aria-pressed="isSelected"
        :aria-label="isStrengthBlock(block) ? block.name : label"
        @click="emit('select')"
      >
        <!-- Drag handle -->
        <div
          class="flex-shrink-0 cursor-grab active:cursor-grabbing touch-manipulation drag-handle"
          :class="disabled && 'opacity-0'"
        >
          <GripVertical class="icon-md text-muted-foreground" aria-hidden="true" />
        </div>

        <!-- Block icon -->
        <div
          :class="
            cn(
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl',
              blockColors.bg,
            )
          "
          aria-hidden="true"
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
          <p :class="cn('text-sm truncate', isSelected ? 'text-foreground/60' : 'text-muted-foreground')">
            {{ subtitle }}
          </p>
        </div>

        <!-- Progress/status -->
        <div v-if="completedSets" class="flex-shrink-0 text-sm text-foreground/70">
          {{ completedSets }}
        </div>
      </button>

      <!-- Actions -->
      <div v-if="!disabled" class="flex-shrink-0 flex items-center gap-1 pr-3">
        <Button
          v-if="isStrengthBlock(block)"
          variant="ghost"
          size="icon-sm"
          class="text-muted-foreground hover:text-foreground"
          :aria-label="t('common.aria.editBlock', { name: block.name })"
          @click.stop="emit('edit')"
        >
          <Pencil class="icon-sm" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          class="text-muted-foreground hover:text-destructive"
          :aria-label="t('common.aria.removeBlock', { name: isStrengthBlock(block) ? block.name : label })"
          @click.stop="emit('remove')"
        >
          <X class="icon-sm" aria-hidden="true" />
        </Button>
      </div>
    </div>
  </div>
</template>
