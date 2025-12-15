<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DbSet } from '@/db/schema'
import WorkoutDetailSetRow from './WorkoutDetailSetRow.vue'

const { t } = useI18n()

const { sets } = defineProps<{
  sets: ReadonlyArray<DbSet>
}>()
</script>

<template>
  <div class="rounded-lg border bg-muted/30">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-14 text-center">{{ t('workouts.table.headers.set') }}</TableHead>
          <TableHead class="text-right">{{ t('workouts.table.headers.weight') }}</TableHead>
          <TableHead class="text-right">{{ t('workouts.table.headers.reps') }}</TableHead>
          <TableHead class="text-right">{{ t('workouts.table.headers.rir') }}</TableHead>
          <TableHead class="text-right">{{ t('workouts.table.headers.estRm') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <WorkoutDetailSetRow v-for="(set, index) in sets" :key="set.id" :set="set" :index="index" />
      </TableBody>
    </Table>
  </div>
</template>
