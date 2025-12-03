<script setup lang="ts">
import { computed } from 'vue'
import type { Set } from '@/composables/useWorkout'
import { isSetReady } from '@/composables/useWorkout'
import { Check, Plus, Trash2, Timer } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { calculate10RM } from '@/lib/workout-utils'
import { useSettingsStore } from '@/stores/settings'
import { kgToLbs, lbsToKg, WEIGHT_UNIT_LABELS } from '@/lib/unitConversion'

const settingsStore = useSettingsStore()

const weightLabel = computed(() => WEIGHT_UNIT_LABELS[settingsStore.weightUnit].toUpperCase())

type Props = {
  sets: Array<Set>
}

defineProps<Props>()
const emit = defineEmits<{
  'toggle-complete': [set: Set]
  'add-set': []
  'remove-set': [setId: number]
  'update-set': [setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined]
}>()

/**
 * Convert stored kg value to display value based on user's unit preference.
 */
function getWeightDisplayValue(set: Set) {
  if (!set.kg) return undefined
  const kgValue = Number(set.kg)
  if (settingsStore.weightUnit === 'lbs') {
    return Math.round(kgToLbs(kgValue))
  }
  return kgValue
}

/**
 * Handle weight input change - convert from display unit to kg for storage.
 */
function handleWeightChange(setId: number, displayValue: number | undefined) {
  if (displayValue === undefined) {
    emit('update-set', setId, 'kg', undefined)
    return
  }
  const kgValue =
    settingsStore.weightUnit === 'lbs' ? Math.round(lbsToKg(displayValue) * 10) / 10 : displayValue
  emit('update-set', setId, 'kg', kgValue)
}

function getRepsValue(set: Set) {
  return set.reps ? Number(set.reps) : undefined
}

function getRirValue(set: Set) {
  return set.rir ? Number(set.rir) : undefined
}

function getFormattedEstimated10RM(set: Set) {
  if (!set.kg || !set.reps) return '—'
  const rm = calculate10RM(Number(set.kg), Number(set.reps))
  // Show 10RM in user's preferred unit
  if (settingsStore.weightUnit === 'lbs') {
    return kgToLbs(rm).toFixed(0)
  }
  return rm.toFixed(1)
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow class="border-none hover:bg-transparent">
        <TableHead class="w-[40px] h-8 p-1">#</TableHead>
        <TableHead class="text-center h-8 p-1">{{ weightLabel }}</TableHead>
        <TableHead class="text-center h-8 p-1">REPS</TableHead>
        <TableHead class="text-center h-8 p-1">RIR</TableHead>
        <TableHead class="text-center h-8 p-1 text-xs">10RM</TableHead>
        <TableHead class="text-center w-[50px] h-8 p-1">✓</TableHead>
        <TableHead class="w-[40px] h-8 p-1" />
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="(set, index) in sets"
        :key="set.id"
        :class="
          cn(
            'border-none transition-all duration-200 hover:bg-transparent cursor-default',
            set.status === 'active' ? 'bg-primary/15 hover:bg-primary/15' : '',
            set.status === 'completed' ? 'opacity-60' : '',
          )
        "
      >
        <TableCell class="font-medium p-1 h-10 tabular-nums">
          <div
            v-if="set.status === 'active'"
            class="bg-primary text-primary-foreground w-6 h-6 rounded-md flex items-center justify-center animate-in zoom-in-50 duration-200"
          >
            <Timer class="w-3 h-3" />
          </div>
          <span v-else>{{ index + 1 }}</span>
        </TableCell>

        <TableCell class="p-1 h-10">
          <NumberField
            :model-value="getWeightDisplayValue(set)"
            :min="0"
            :max="999"
            @update:model-value="handleWeightChange(set.id, $event)"
          >
            <NumberFieldInput
              placeholder="—"
              aria-label="Weight"
              class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base tabular-nums rounded-lg"
            />
          </NumberField>
        </TableCell>

        <TableCell class="p-1 h-10">
          <NumberField
            :model-value="getRepsValue(set)"
            :min="0"
            :max="999"
            @update:model-value="$emit('update-set', set.id, 'reps', $event)"
          >
            <NumberFieldInput
              placeholder="—"
              aria-label="Reps"
              class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base text-primary tabular-nums rounded-lg"
            />
          </NumberField>
        </TableCell>

        <TableCell class="p-1 h-10">
          <NumberField
            :model-value="getRirValue(set)"
            :min="0"
            :max="10"
            @update:model-value="$emit('update-set', set.id, 'rir', $event)"
          >
            <NumberFieldInput
              placeholder="—"
              aria-label="Reps in reserve"
              class="bg-secondary border-0 shadow-none focus-visible:ring-0 h-8 text-muted-foreground tabular-nums rounded-lg"
            />
          </NumberField>
        </TableCell>

        <TableCell class="p-1 h-10 text-center text-xs text-muted-foreground">
          {{ getFormattedEstimated10RM(set) }}
        </TableCell>

        <TableCell class="p-1 h-10 text-center">
          <Button
            size="icon"
            aria-label="Mark set complete"
            :class="
              cn(
                'h-9 w-9 rounded-lg transition-all duration-200',
                set.status === 'completed'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : isSetReady(set)
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:scale-105',
              )
            "
            @click="$emit('toggle-complete', set)"
          >
            <Check
              :class="
                cn(
                  'w-4 h-4 transition-all',
                  set.status === 'completed'
                    ? 'animate-in zoom-in-50 duration-200'
                    : isSetReady(set)
                      ? 'opacity-100'
                      : 'opacity-30',
                )
              "
            />
          </Button>
        </TableCell>

        <TableCell class="p-1 h-10 text-center">
          <Button
            v-if="sets.length > 1"
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-muted-foreground hover:text-destructive"
            @click="$emit('remove-set', set.id)"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <!-- Add Set Button -->
  <Button
    variant="ghost"
    class="w-full mt-2 text-muted-foreground hover:text-foreground"
    @click="$emit('add-set')"
  >
    <Plus class="w-4 h-4 mr-2" />
    Add Set
  </Button>
</template>
