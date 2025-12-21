<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import type { DbTemplateBlock } from '@/db/schema'
import { BLOCK_COLORS, BLOCK_ICONS, BLOCK_LABELS } from '@/types/blocks'
import { CARDIO_ACTIVITIES } from '@/types/blocks'

const { t } = useI18n()

type Movement = {
  canMoveUp: boolean
  canMoveDown: boolean
}

type Props = {
  block: DbTemplateBlock
  movement: Movement
}

type Emits = {
  'update:setCount': [count: number]
  remove: []
  'move-up': []
  'move-down': []
}

const { block, movement } = defineProps<Props>()
const emit = defineEmits<Emits>()

const isStrength = computed(() => block.kind === 'strength')

const strengthImage = computed(() => {
  if (block.kind === 'strength') {
    return block.image
  }
  return null
})

const strengthName = computed(() => {
  if (block.kind === 'strength') {
    return block.name
  }
  return ''
})

const blockIcon = computed(() => {
  if (block.kind === 'strength') {
    return null // Use ExerciseAvatar instead
  }
  if (block.kind === 'cardio') {
    return CARDIO_ACTIVITIES.find((a) => a.value === block.config.activity)?.icon ?? '🏃'
  }
  return BLOCK_ICONS[block.kind]
})

const blockTitle = computed(() => {
  if (block.kind === 'strength') {
    return block.name
  }
  if (block.kind === 'cardio') {
    return CARDIO_ACTIVITIES.find((a) => a.value === block.config.activity)?.label ?? 'Cardio'
  }
  return BLOCK_LABELS[block.kind]
})

function formatExerciseCount(count: number): string {
  return `${count} ${count === 1 ? 'exercise' : 'exercises'}`
}

function getBlockSubtitle(blk: DbTemplateBlock): string {
  switch (blk.kind) {
    case 'strength':
      return `${blk.equipment} · ${blk.defaultSetCount} ${t('workouts.templates.sets')}`
    case 'amrap':
      return `${Math.floor(blk.config.durationSeconds / 60)} min · ${formatExerciseCount(blk.exercises.length)}`
    case 'emom':
      return `${blk.config.minutes} min · ${blk.config.exerciseRotation === 'full-round' ? 'Full Round' : 'Per Exercise'}`
    case 'tabata':
      return `${blk.config.rounds} rounds · ${Math.floor(blk.config.rounds * (blk.config.workSeconds + blk.config.restSeconds) / 60)} min`
    case 'fortime':
      return `${blk.config.timeCapSeconds ? `Cap: ${Math.floor(blk.config.timeCapSeconds / 60)} min` : 'No cap'} · ${formatExerciseCount(blk.exercises.length)}`
    case 'cardio':
      return formatCardioSubtitle(blk.config)
  }
}

type CardioConfig = {
  targetDurationSeconds: number | null
  targetDistanceMeters: number | null
}

function formatCardioSubtitle(config: CardioConfig): string {
  const parts: Array<string> = []
  if (config.targetDurationSeconds) {
    parts.push(`${Math.floor(config.targetDurationSeconds / 60)} min`)
  }
  if (config.targetDistanceMeters) {
    parts.push(`${(config.targetDistanceMeters / 1000).toFixed(1)} km`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Open'
}

const blockSubtitle = computed(() => getBlockSubtitle(block))

const blockColors = computed(() => BLOCK_COLORS[block.kind])

const setCount = computed(() => {
  if (block.kind === 'strength') {
    return block.defaultSetCount
  }
  return 0
})

const MAX_SET_COUNT = 10

function handleSetCountChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const count = parseInt(target.value, 10)
  if (count > 0 && count <= MAX_SET_COUNT) {
    emit('update:setCount', count)
  }
}

function incrementSetCount(): void {
  emit('update:setCount', setCount.value + 1)
}

function decrementSetCount(): void {
  if (setCount.value > 1) {
    emit('update:setCount', setCount.value - 1)
  }
}
</script>

<template>
  <div class="bg-muted/30 rounded-xl border border-border/50 overflow-hidden">
    <!-- Top row: Block info -->
    <div class="flex items-center gap-3 p-4">
      <ExerciseAvatar
        v-if="block.kind === 'strength'"
        :name="strengthName"
        :image="strengthImage"
        size="lg"
      />
      <div
        v-else
        :class="[
          'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl',
          blockColors.bg,
        ]"
        role="img"
        :aria-label="blockTitle"
      >
        {{ blockIcon }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="font-semibold text-base leading-tight">{{ blockTitle }}</p>
          <span
            v-if="!isStrength"
            :class="[
              'px-2 py-0.5 text-xs font-medium rounded-full',
              blockColors.bg,
              blockColors.text,
            ]"
          >
            {{ BLOCK_LABELS[block.kind] }}
          </span>
        </div>
        <p class="text-sm text-muted-foreground mt-0.5">{{ blockSubtitle }}</p>
      </div>
    </div>

    <!-- Bottom row: Controls -->
    <div
      class="flex items-center justify-between gap-2 px-4 py-3 bg-background/50 border-t border-border/30"
    >
      <!-- Set count control (strength only) -->
      <div v-if="isStrength" class="flex items-center gap-3">
        <span class="text-sm text-muted-foreground font-medium">{{
          t('workouts.templates.sets')
        }}</span>
        <div class="flex items-center bg-background rounded-lg border border-border shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            class="rounded-l-lg rounded-r-none"
            :disabled="setCount === 1"
            :aria-label="t('common.aria.decreaseSetCount')"
            @click="decrementSetCount"
          >
            <Minus class="icon-sm" />
          </Button>
          <input
            type="number"
            :value="setCount"
            min="1"
            max="10"
            :aria-label="t('common.aria.setCount')"
            class="w-10 text-center text-base font-semibold border-0 bg-transparent focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @change="handleSetCountChange"
          />
          <Button
            variant="ghost"
            size="icon"
            class="rounded-r-lg rounded-l-none"
            :aria-label="t('common.aria.increaseSetCount')"
            @click="incrementSetCount"
          >
            <Plus class="icon-sm" />
          </Button>
        </div>
      </div>

      <!-- Placeholder for timed/cardio blocks -->
      <div v-else class="flex-1" />

      <!-- Action buttons -->
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          :disabled="!movement.canMoveUp"
          :aria-label="t('common.aria.moveUp')"
          @click="$emit('move-up')"
        >
          <ChevronUp class="icon-md" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :disabled="!movement.canMoveDown"
          :aria-label="t('common.aria.moveDown')"
          @click="$emit('move-down')"
        >
          <ChevronDown class="icon-md" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          :aria-label="t('common.aria.removeExercise')"
          @click="$emit('remove')"
        >
          <Trash2 class="icon-md" />
        </Button>
      </div>
    </div>
  </div>
</template>
