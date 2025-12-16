<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { isSetReady } from '@/features/workout/composables/useWorkout'
import { calculate10RM } from '@/lib/workout-utils'
import { cn } from '@/lib/utils'
import type { StrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import { Check, Plus } from 'lucide-vue-next'

const { t } = useI18n()

type Props = {
  block: StrengthBlock
  activeSetIndex: number
}

const emit = defineEmits<{
  'update-set': [setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined]
  'toggle-complete': [set: Set]
  'add-set': []
}>()

const { block, activeSetIndex } = defineProps<Props>()

const { unitLabel, toDisplayValue, toStorageValue } = useWeightDisplay()

const weightLabel = computed(() => unitLabel.value.toUpperCase())

const tableAriaLabel = computed(() =>
  t('common.aria.workoutSetsTable', { exercise: block.name }),
)

// Class generation functions (extracted to reduce computed complexity)
const baseInputClass = 'border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-11 font-bold text-base tabular-nums rounded-lg text-center'

function getRowClass(isActive: boolean, isCompleted: boolean) {
  return cn(
    'border-none transition-all duration-200 hover:bg-transparent',
    isActive && 'bg-primary/10',
    isCompleted && 'opacity-50',
  )
}

function getInputClass(isActive: boolean) {
  return cn(baseInputClass, isActive ? 'bg-secondary' : 'bg-transparent')
}

function getRepsInputClass(isActive: boolean) {
  return cn(baseInputClass, isActive ? 'bg-secondary text-primary' : 'bg-transparent')
}

function getRirInputClass(isActive: boolean) {
  const base = 'border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-11 text-muted-foreground tabular-nums rounded-lg text-center'
  return cn(base, isActive ? 'bg-secondary' : 'bg-transparent')
}

function getCompleteButtonClass(isCompleted: boolean, ready: boolean) {
  return cn(
    'h-11 w-11 rounded-lg transition-all duration-200',
    isCompleted
      ? 'bg-success hover:bg-success/90 text-success-foreground'
      : ready
        ? 'bg-success hover:bg-success/90 text-success-foreground hover:scale-105'
        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground',
  )
}

function getCheckIconClass(isCompleted: boolean, ready: boolean) {
  return cn(
    'w-4 h-4 transition-all',
    isCompleted ? 'animate-in zoom-in-50 duration-200' : ready ? 'opacity-100' : 'opacity-30',
  )
}

function getEstimated10RM(kg: string | number | undefined, reps: string | number | undefined) {
  if (!kg || !reps) return '—'
  const calculated = toDisplayValue(calculate10RM(Number(kg), Number(reps)))
  return calculated?.toString() ?? '—'
}

// Pre-compute all derived state for each set
const setStates = computed(() =>
  block.sets.map((set, index) => {
    const isCompleted = set.status === 'completed'
    const isActive = index === activeSetIndex
    const ready = isSetReady(set)

    return {
      set,
      index,
      setNumber: index + 1,
      isCompleted,
      isActive,
      isPending: !isCompleted && !isActive,
      ready,
      weightValue: toDisplayValue(set.kg),
      repsValue: set.reps ? Number(set.reps) : undefined,
      rirValue: set.rir ? Number(set.rir) : undefined,
      estimated10RM: getEstimated10RM(set.kg, set.reps),
      rowClass: getRowClass(isActive, isCompleted),
      inputClass: getInputClass(isActive),
      repsInputClass: getRepsInputClass(isActive),
      rirInputClass: getRirInputClass(isActive),
      completeButtonClass: getCompleteButtonClass(isCompleted, ready),
      checkIconClass: getCheckIconClass(isCompleted, ready),
    }
  }),
)

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

function handleWeightInput(set: Set, value: string) {
  const normalized = normalizeDecimalInput(value)
  emit('update-set', set.id, 'kg', normalized !== undefined ? toStorageValue(normalized) : undefined)
}

function handleRepsInput(set: Set, value: string) {
  const numValue = value ? Number(value) : undefined
  emit('update-set', set.id, 'reps', numValue)
}

function handleRirInput(set: Set, value: string) {
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
  <div class="flex-1 flex flex-col px-4 py-4">
    <!-- Compact Header -->
    <header class="mb-4">
      <h1 class="text-base font-bold uppercase tracking-widest text-foreground/90">
        {{ block.name }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ block.equipment }}
      </p>
    </header>

    <!-- Sets Table -->
    <div class="flex-1 overflow-auto">
      <Table :aria-label="tableAriaLabel">
        <TableHeader>
          <TableRow class="border-none hover:bg-transparent">
            <TableHead class="w-12 h-8 p-1 text-xs">#</TableHead>
            <TableHead class="h-8 p-1 text-xs text-center">{{ weightLabel }}</TableHead>
            <TableHead class="h-8 p-1 text-xs text-center">{{
              t('workouts.table.headers.reps').toUpperCase()
            }}</TableHead>
            <TableHead class="h-8 p-1 text-xs text-center">{{
              t('workouts.table.headers.rir').toUpperCase()
            }}</TableHead>
            <TableHead class="h-8 p-1 text-xs text-center hidden sm:table-cell">{{
              t('workouts.table.headers.tenRm')
            }}</TableHead>
            <TableHead class="w-14 h-8 p-1">
              <span class="sr-only">{{ t('common.aria.statusColumn') }}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="state in setStates"
            :key="state.set.id"
            :class="state.rowClass"
            :aria-current="state.isActive ? 'true' : undefined"
          >
            <!-- Set Number -->
            <TableCell class="p-1 h-14">
              <div
                v-if="state.isCompleted"
                class="w-7 h-7 rounded-md bg-success/20 flex items-center justify-center"
              >
                <Check class="w-3.5 h-3.5 text-success" aria-hidden="true" />
              </div>
              <div
                v-else-if="state.isActive"
                class="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tabular-nums"
              >
                {{ state.setNumber }}
              </div>
              <span v-else class="text-muted-foreground tabular-nums pl-2">{{ state.setNumber }}</span>
            </TableCell>

            <!-- Weight -->
            <TableCell class="p-1 h-14">
              <Input
                type="text"
                inputmode="decimal"
                :model-value="formatWeightValue(state.set.kg)"
                placeholder="—"
                :aria-label="t('common.aria.weightForSet', { number: state.setNumber })"
                :class="state.inputClass"
                @update:model-value="(v) => handleWeightInput(state.set, String(v))"
              />
            </TableCell>

            <!-- Reps -->
            <TableCell class="p-1 h-14">
              <Input
                type="number"
                inputmode="numeric"
                :model-value="formatNumberValue(state.set.reps)"
                placeholder="—"
                :aria-label="t('common.aria.repsForSet', { number: state.setNumber })"
                :class="state.repsInputClass"
                @update:model-value="(v) => handleRepsInput(state.set, String(v))"
              />
            </TableCell>

            <!-- RIR -->
            <TableCell class="p-1 h-14">
              <Input
                type="number"
                inputmode="numeric"
                :model-value="formatNumberValue(state.set.rir)"
                placeholder="—"
                :aria-label="t('common.aria.repsInReserveForSet', { number: state.setNumber })"
                :class="state.rirInputClass"
                @update:model-value="(v) => handleRirInput(state.set, String(v))"
              />
            </TableCell>

            <!-- 10RM (hidden on small screens) -->
            <TableCell class="p-1 h-14 text-center text-xs text-muted-foreground hidden sm:table-cell">
              {{ state.estimated10RM }}
            </TableCell>

            <!-- Complete Button -->
            <TableCell class="p-1 h-14 text-center">
              <Button
                size="icon"
                :aria-label="t('common.aria.markSetNumberComplete', { number: state.setNumber })"
                :class="state.completeButtonClass"
                @click="emit('toggle-complete', state.set)"
              >
                <Check :class="state.checkIconClass" aria-hidden="true" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Add Set Button -->
    <Button
      variant="ghost"
      class="w-full mt-3 h-11 text-muted-foreground hover:text-foreground"
      @click="emit('add-set')"
    >
      <Plus class="w-4 h-4 mr-2" aria-hidden="true" />
      {{ t('workouts.sets.addSet') }}
    </Button>
  </div>
</template>
