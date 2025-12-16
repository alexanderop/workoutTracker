<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Set } from '@/features/workout/composables/useWorkout'
import { isSetReady } from '@/features/workout/composables/useWorkout'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { calculate10RM } from '@/lib/workout-utils'
import { cn } from '@/lib/utils'
import { TableCell, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Timer, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()

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

const completeButtonClass = computed(() =>
  cn(
    'h-9 w-9 rounded-lg transition-all duration-200',
    isCompleted.value
      ? 'bg-success hover:bg-success/90 text-success-foreground'
      : ready.value
        ? 'bg-success hover:bg-success/90 text-success-foreground hover:scale-105'
        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:scale-105',
  ),
)

const checkIconClass = computed(() =>
  cn(
    'w-4 h-4 transition-all',
    isCompleted.value
      ? 'animate-in zoom-in-50 duration-200'
      : ready.value
        ? 'opacity-100'
        : 'opacity-30',
  ),
)

function getEstimated10RM() {
  if (!set.kg || !set.reps) return '—'
  const rm = calculate10RM(Number(set.kg), Number(set.reps))
  return toDisplayValue(rm)?.toString() ?? '—'
}

// Helper function to normalize and format decimal input
function normalizeDecimalInput(value: string): number | undefined {
  if (!value || value === '') return undefined

  // Replace comma with period for decimal separator
  const normalized = value.replace(',', '.')
  const num = Number(normalized)

  if (isNaN(num)) return undefined

  // Round to 2 decimal places
  return Math.round(num * 100) / 100
}

function handleWeightInput(value: string) {
  const normalized = normalizeDecimalInput(value)
  emit('update-set', set.id, 'kg', normalized !== undefined ? toStorageValue(normalized) : undefined)
}

function handleRepsInput(value: string) {
  const numValue = value ? Number(value) : undefined
  emit('update-set', set.id, 'reps', numValue)
}

function handleRirInput(value: string) {
  const numValue = value ? Number(value) : undefined
  emit('update-set', set.id, 'rir', numValue)
}

// Format value for display (handle both comma and period)
function formatWeightValue(kg: string | number | undefined): string {
  const displayValue = toDisplayValue(kg)
  if (displayValue === undefined) return ''
  return displayValue.toString()
}

function formatNumberValue(value: string | number | undefined): string {
  if (value === undefined || value === '') return ''
  return value.toString()
}
</script>

<template>
  <TableRow :class="rowClass">
    <!-- Set Number -->
    <TableCell class="font-medium p-1 h-10 tabular-nums">
      <div
        v-if="isActive"
        class="bg-primary text-primary-foreground w-6 h-6 rounded-md flex items-center justify-center animate-in zoom-in-50 duration-200"
      >
        <Timer class="w-3 h-3" />
      </div>
      <span v-else>{{ index + 1 }}</span>
    </TableCell>

    <!-- Weight -->
    <TableCell class="p-1 h-10">
      <Input
        type="text"
        inputmode="decimal"
        :model-value="formatWeightValue(set.kg)"
        placeholder="—"
        :aria-label="t('common.aria.weight')"
        class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base tabular-nums rounded-lg"
        @update:model-value="(v) => handleWeightInput(String(v))"
      />
    </TableCell>

    <!-- Reps -->
    <TableCell class="p-1 h-10">
      <Input
        type="number"
        inputmode="numeric"
        :model-value="formatNumberValue(set.reps)"
        placeholder="—"
        :aria-label="t('common.aria.reps')"
        class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base text-primary tabular-nums rounded-lg"
        @update:model-value="(v) => handleRepsInput(String(v))"
      />
    </TableCell>

    <!-- RIR -->
    <TableCell class="p-1 h-10">
      <Input
        type="number"
        inputmode="numeric"
        :model-value="formatNumberValue(set.rir)"
        placeholder="—"
        :aria-label="t('common.aria.repsInReserve')"
        class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 text-muted-foreground tabular-nums rounded-lg"
        @update:model-value="(v) => handleRirInput(String(v))"
      />
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
