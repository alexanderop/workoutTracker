<script setup lang="ts">
import type { Set } from '@/composables/useWorkout'
import { Check, Timer } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface Props {
  sets: Set[]
}

defineProps<Props>()
defineEmits<{
  toggleComplete: [set: Set]
}>()
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow class="border-none hover:bg-transparent">
        <TableHead class="w-[40px] h-8 p-1">
          #
        </TableHead>
        <TableHead class="text-center h-8 p-1">
          KG
        </TableHead>
        <TableHead class="text-center h-8 p-1">
          REPS
        </TableHead>
        <TableHead class="text-center h-8 p-1">
          RIR
        </TableHead>
        <TableHead class="text-center h-8 p-1 text-xs">
          10RM
        </TableHead>
        <TableHead class="text-center w-[50px] h-8 p-1">
          ✓
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="(set, index) in sets"
        :key="set.id"
        :class="cn(
          'border-none transition-colors hover:bg-transparent cursor-default',
          set.status === 'active' ? 'bg-blue-500/20 hover:bg-blue-500/20' : '',
          set.status === 'completed' ? 'opacity-60' : '',
        )"
      >
        <TableCell class="font-medium p-1 h-10 tabular-nums">
          <div
            v-if="set.status === 'active'"
            class="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center"
          >
            <Timer class="w-3 h-3" />
          </div>
          <span v-else>{{ index + 1 }}</span>
        </TableCell>

        <TableCell class="p-1 h-10">
          <Input
            :model-value="set.kg"
            type="number"
            placeholder="—"
            class="text-center bg-transparent border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base tabular-nums"
            @update:model-value="set.kg = String($event)"
          />
        </TableCell>

        <TableCell class="p-1 h-10">
          <Input
            :model-value="set.reps"
            type="number"
            placeholder="—"
            class="text-center bg-transparent border-0 shadow-none focus-visible:ring-0 h-8 font-bold text-base text-blue-400 tabular-nums"
            @update:model-value="set.reps = String($event)"
          />
        </TableCell>

        <TableCell class="p-1 h-10">
          <Input
            :model-value="set.rir"
            type="number"
            placeholder="—"
            class="text-center bg-transparent border-0 shadow-none focus-visible:ring-0 h-8 text-muted-foreground tabular-nums"
            @update:model-value="set.rir = String($event)"
          />
        </TableCell>

        <TableCell class="p-1 h-10 text-center text-xs text-muted-foreground">
          {{ set.kg && set.reps ? calculate10RM(parseInt(set.kg), parseInt(set.reps)).toFixed(1) : '—' }}
        </TableCell>

        <TableCell class="p-1 h-10 text-center">
          <Button
            size="icon"
            :class="cn(
              'h-8 w-8 rounded-md',
              set.status === 'completed'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-secondary hover:bg-secondary/80 text-muted-foreground',
            )"
            @click="$emit('toggleComplete', set)"
          >
            <Check v-if="set.status === 'completed'" class="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
