<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Set } from '@/features/workout/composables/useWorkout'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import WorkoutSetTableRow from '@/features/workout/components/WorkoutSetTableRow.vue'

const { t } = useI18n()
const { unitLabel } = useWeightDisplay()

const weightLabel = computed(() => unitLabel.value.toUpperCase())

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

function handleUpdateSet(setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined) {
  emit('update-set', setId, field, value)
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow class="border-none hover:bg-transparent">
        <TableHead class="w-[40px] h-8 p-1">#</TableHead>
        <TableHead class="text-center h-8 p-1">{{ weightLabel }}</TableHead>
        <TableHead class="text-center h-8 p-1">{{
          t('workouts.table.headers.reps').toUpperCase()
        }}</TableHead>
        <TableHead class="text-center h-8 p-1">{{
          t('workouts.table.headers.rir').toUpperCase()
        }}</TableHead>
        <TableHead class="text-center h-8 p-1 text-xs">{{
          t('workouts.table.headers.tenRm')
        }}</TableHead>
        <TableHead class="text-center w-[50px] h-8 p-1">✓</TableHead>
        <TableHead class="w-[40px] h-8 p-1" />
      </TableRow>
    </TableHeader>
    <TableBody>
      <WorkoutSetTableRow
        v-for="(set, index) in sets"
        :key="set.id"
        :set="set"
        :index="index"
        :can-delete="sets.length > 1"
        @toggle-complete="emit('toggle-complete', $event)"
        @remove-set="emit('remove-set', $event)"
        @update-set="handleUpdateSet"
      />
    </TableBody>
  </Table>

  <!-- Add Set Button -->
  <Button
    variant="ghost"
    class="w-full mt-2 text-muted-foreground hover:text-foreground"
    @click="emit('add-set')"
  >
    <Plus class="icon-sm mr-2" />
    {{ t('workouts.sets.addSet') }}
  </Button>
</template>
