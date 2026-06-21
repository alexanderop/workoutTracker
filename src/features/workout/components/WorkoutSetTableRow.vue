<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Set } from '@/features/workout/composables/useWorkout'
import { isSetReady } from '@/features/workout/composables/useWorkout'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useNumberLocale } from '@/composables/useNumberLocale'
import { calculate10RM } from '@/lib/workout-utils'
import { cn } from '@/lib/utils'
import { TableCell, TableRow } from '@/components/ui/table'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Button } from '@/components/ui/button'
import { Check, Timer, Trash2 } from '@lucide/vue'

const { t } = useI18n()
const { intlLocale } = useNumberLocale()

const { set, index, canDelete } = defineProps<{
  set: Set
  index: number
  canDelete: boolean
}>()

const emit = defineEmits<{
  'toggle-complete': [set: Set]
  'remove-set': [setId: number]
  'update-set': [setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined]
}>()

const { toDisplayValue, toStorageValue } = useWeightDisplay()

// Allow 2 decimal places for weight (micro plates like 0.25kg)
const weightFormatOptions = {
  maximumFractionDigits: 2,
  useGrouping: false,
}

const isActive = computed(() => set.status === 'active')
const isCompleted = computed(() => set.status === 'completed')
const ready = computed(() => isSetReady(set))

const rowClass = computed(() =>
  cn(
    'border-none transition-all duration-200 hover:bg-transparent cursor-default',
    isActive.value && 'bg-primary/15 hover:bg-primary/15',
    isCompleted.value && 'opacity-60',
  ),
)

function getCompleteButtonStateClass(completed: boolean, isReady: boolean): string {
  if (completed) return 'bg-success hover:bg-success/90 text-success-foreground'
  if (isReady) return 'bg-success hover:bg-success/90 text-success-foreground hover:scale-105'
  return 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:scale-105'
}

function getCheckIconStateClass(completed: boolean, isReady: boolean): string {
  if (completed) return 'animate-in zoom-in-50 duration-200'
  if (isReady) return 'opacity-100'
  return 'opacity-30'
}

const completeButtonClass = computed(() =>
  cn('h-9 w-9 rounded-lg transition-all duration-200', getCompleteButtonStateClass(isCompleted.value, ready.value)),
)

const checkIconClass = computed(() =>
  cn('w-4 h-4 transition-all', getCheckIconStateClass(isCompleted.value, ready.value)),
)

function getRepsValue() {
  return set.reps ? Number(set.reps) : undefined
}

function getRirValue() {
  return set.rir ? Number(set.rir) : undefined
}

function getEstimated10RM() {
  if (!set.kg || !set.reps) return '—'
  const rm = calculate10RM(Number(set.kg), Number(set.reps))
  return toDisplayValue(rm)?.toString() ?? '—'
}

function handleWeightChange(displayValue: number | undefined) {
  emit('update-set', set.id, 'kg', toStorageValue(displayValue))
}

function handleRepsChange(value: number | undefined) {
  emit('update-set', set.id, 'reps', value)
}

function handleRirChange(value: number | undefined) {
  emit('update-set', set.id, 'rir', value)
}
</script>

<template>
  <TableRow :class="rowClass">
    <!-- Set Number -->
    <TableCell class="font-medium p-1 h-10 tabular-nums">
      <div
        v-if="isActive"
        data-set-state="active"
        class="bg-primary text-primary-foreground w-6 h-6 rounded-md flex items-center justify-center animate-in zoom-in-50 duration-200"
      >
        <Timer class="w-3 h-3" />
      </div>
      <div
        v-else-if="isCompleted"
        data-set-state="completed"
        class="w-6 h-6 rounded-md flex items-center justify-center bg-success/20 text-success"
      >
        <Check class="w-3 h-3" />
      </div>
      <span v-else>{{ index + 1 }}</span>
    </TableCell>

    <!-- Weight -->
    <TableCell class="p-1 h-10">
      <NumberField
        :model-value="toDisplayValue(set.kg)"
        :min="0"
        :max="999"
        :step="0.01"
        :format-options="weightFormatOptions"
        :locale="intlLocale"
        @update:model-value="handleWeightChange"
      >
        <NumberFieldInput
          placeholder="—"
          :aria-label="t('common.aria.weight')"
          class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base tabular-nums rounded-lg"
        />
      </NumberField>
    </TableCell>

    <!-- Reps -->
    <TableCell class="p-1 h-10">
      <NumberField
        :model-value="getRepsValue()"
        :min="0"
        :max="999"
        @update:model-value="handleRepsChange"
      >
        <NumberFieldInput
          placeholder="—"
          :aria-label="t('common.aria.reps')"
          class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base text-primary tabular-nums rounded-lg"
        />
      </NumberField>
    </TableCell>

    <!-- RIR -->
    <TableCell class="p-1 h-10">
      <NumberField
        :model-value="getRirValue()"
        :min="0"
        :max="10"
        @update:model-value="handleRirChange"
      >
        <NumberFieldInput
          placeholder="—"
          :aria-label="t('common.aria.repsInReserve')"
          class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 text-muted-foreground tabular-nums rounded-lg"
        />
      </NumberField>
    </TableCell>

    <!-- 10RM -->
    <TableCell class="p-1 h-10 text-center text-xs text-muted-foreground">
      {{ getEstimated10RM() }}
    </TableCell>

    <!-- Complete Button -->
    <TableCell class="p-1 h-10 text-center">
      <Button
        size="icon"
        :aria-label="t('common.aria.markSetComplete')"
        :class="completeButtonClass"
        @click="emit('toggle-complete', set)"
      >
        <Check :class="checkIconClass" />
      </Button>
    </TableCell>

    <!-- Delete Button -->
    <TableCell class="p-1 h-10 text-center">
      <Button
        v-if="canDelete"
        variant="ghost"
        size="icon-sm"
        :aria-label="t('common.aria.deleteSet', { index: index + 1 })"
        class="text-muted-foreground hover:text-destructive"
        @click="emit('remove-set', set.id)"
      >
        <Trash2 class="w-4 h-4" aria-hidden="true" />
      </Button>
    </TableCell>
  </TableRow>
</template>
