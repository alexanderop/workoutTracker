<script setup lang="ts">
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DbSet } from '@/db/schema'
import WorkoutDetailSetRow from './WorkoutDetailSetRow.vue'

defineProps<{
  sets: ReadonlyArray<DbSet>
}>()
</script>

<template>
  <div class="rounded-lg border bg-muted/30">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-14 text-center">Set</TableHead>
          <TableHead class="text-right">Weight</TableHead>
          <TableHead class="text-right">Reps</TableHead>
          <TableHead class="text-right">RIR</TableHead>
          <TableHead class="text-right">Est. 1RM</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <WorkoutDetailSetRow v-for="(set, index) in sets" :key="set.id" :set="set" :index="index" />
      </TableBody>
    </Table>
  </div>
</template>
