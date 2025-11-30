<script setup lang="ts">
import { TableCell, TableRow } from '@/components/ui/table'
import type { DbSet } from '@/db/schema'
import { calculate10RM } from '@/lib/workout-utils'

const { set, index } = defineProps<{
  set: DbSet
  index: number
}>()

const isCompleted = set.status === 'completed'

function formatOneRepMax(kg: string, reps: string): string {
  const kgNum = Number.parseFloat(kg) || 0
  const repsNum = Number.parseFloat(reps) || 0
  if (kgNum === 0 || repsNum === 0) return '—'
  return `${calculate10RM(kgNum, repsNum)}kg`
}
</script>

<template>
  <TableRow class="hover:bg-transparent" :class="{ 'text-muted-foreground/50': !isCompleted }">
    <TableCell class="text-center font-mono tabular-nums">
      {{ index + 1 }}
    </TableCell>
    <TableCell class="text-right font-mono tabular-nums">
      <span :class="{ 'font-semibold text-primary': isCompleted }"> {{ set.kg || '—' }}kg </span>
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
      {{ formatOneRepMax(set.kg, set.reps) }}
    </TableCell>
  </TableRow>
</template>
