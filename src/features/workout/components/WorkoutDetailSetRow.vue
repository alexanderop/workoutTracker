<script setup lang="ts">
import { computed } from 'vue'
import { TableCell, TableRow } from '@/components/ui/table'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { DbSet } from '@/blocks'
import { calculate10RM } from '@/lib/workout-utils'

const { set, index } = defineProps<{
  set: DbSet
  index: number
}>()

const { formatWithUnit, toDisplayValue, unitLabel } = useWeightDisplay()

const isCompleted = computed(() => set.status === 'completed')

const displayedWeight = computed(() => {
  if (!set.kg) return '—'
  const display = toDisplayValue(set.kg)
  return display === undefined ? '—' : `${display}${unitLabel.value}`
})

const estimatedRM = computed(() => {
  const kgNumber = Number.parseFloat(set.kg) || 0
  const repsNumber = Number.parseFloat(set.reps) || 0
  if (kgNumber === 0 || repsNumber === 0) return '—'
  return formatWithUnit(calculate10RM(kgNumber, repsNumber))
})
</script>

<template>
  <TableRow class="hover:bg-transparent" :class="{ 'text-muted-foreground/50': !isCompleted }">
    <TableCell class="text-center font-mono tabular-nums">
      {{ index + 1 }}
    </TableCell>
    <TableCell class="text-right font-mono tabular-nums">
      <span :class="{ 'font-semibold text-primary': isCompleted }">
        {{ displayedWeight }}
      </span>
    </TableCell>
    <TableCell class="text-right font-mono tabular-nums">
      <span :class="{ 'font-semibold text-primary': isCompleted }">
        {{ set.reps || '—' }}
      </span>
    </TableCell>
    <TableCell class="text-right font-mono tabular-nums">
      {{ set.rir || '—' }}
    </TableCell>
    <TableCell class="text-right font-mono tabular-nums">
      {{ estimatedRM }}
    </TableCell>
  </TableRow>
</template>
