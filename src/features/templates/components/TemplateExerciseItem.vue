<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { t } = useI18n()

type Exercise = {
  exerciseId: string
  name: string
  equipment: string
  thumbnail: string
  defaultSetCount: number
}

type Movement = {
  canMoveUp: boolean
  canMoveDown: boolean
}

type Props = {
  exercise: Exercise
  movement: Movement
}

type Emits = {
  'update:setCount': [count: number]
  remove: []
  'move-up': []
  'move-down': []
}

const { exercise, movement } = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleSetCountChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const count = parseInt(target.value, 10)
  if (count > 0) {
    emit('update:setCount', count)
  }
}

function incrementSetCount(): void {
  emit('update:setCount', exercise.defaultSetCount + 1)
}

function decrementSetCount(): void {
  if (exercise.defaultSetCount > 1) {
    emit('update:setCount', exercise.defaultSetCount - 1)
  }
}
</script>

<template>
  <div class="bg-muted/30 rounded-xl border border-border/50 overflow-hidden">
    <!-- Top row: Exercise info -->
    <div class="flex items-center gap-3 p-4">
      <div class="flex-shrink-0 text-3xl" role="img" :aria-label="exercise.name">
        {{ exercise.thumbnail }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-base leading-tight">{{ exercise.name }}</p>
        <p class="text-sm text-muted-foreground mt-0.5">{{ exercise.equipment }}</p>
      </div>
    </div>

    <!-- Bottom row: Controls -->
    <div
      class="flex items-center justify-between gap-2 px-4 py-3 bg-background/50 border-t border-border/30"
    >
      <!-- Set count control -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted-foreground font-medium">{{
          t('workouts.templates.sets')
        }}</span>
        <div class="flex items-center bg-background rounded-lg border border-border shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            class="rounded-l-lg rounded-r-none"
            :disabled="exercise.defaultSetCount === 1"
            :aria-label="t('common.aria.decreaseSetCount')"
            @click="decrementSetCount"
          >
            <Minus class="size-4" />
          </Button>
          <input
            type="number"
            :value="exercise.defaultSetCount"
            min="1"
            max="10"
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
            <Plus class="size-4" />
          </Button>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          :disabled="!movement.canMoveUp"
          :aria-label="t('common.aria.moveUp')"
          @click="$emit('move-up')"
        >
          <ChevronUp class="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :disabled="!movement.canMoveDown"
          :aria-label="t('common.aria.moveDown')"
          @click="$emit('move-down')"
        >
          <ChevronDown class="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          :aria-label="t('common.aria.removeExercise')"
          @click="$emit('remove')"
        >
          <Trash2 class="size-5" />
        </Button>
      </div>
    </div>
  </div>
</template>
