<script setup lang="ts">
/**
 * `rows` mode: the compact layout, one `HabitHomeRow` per habit.
 *
 * A container rather than a bare `v-for` in the view, because the aligned date
 * header this list grows sits above the rows and has to share their column
 * geometry.
 */
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import HabitHomeRow from './HabitHomeRow.vue'

defineProps<{ items: ReadonlyArray<HabitTodayItem> }>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'open-details': [habit: DbHabit]
}>()
</script>

<template>
  <div class="space-y-2">
    <HabitHomeRow
      v-for="item in items"
      :key="item.habit.id"
      :item="item"
      @toggle="emit('toggle', $event)"
      @open-details="emit('open-details', $event)"
    />
  </div>
</template>
