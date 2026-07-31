<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from '@lucide/vue'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import { buildCompactHabitGrid } from '../lib/habitGrid'
import { habitDayCellClass } from '../lib/gridCell'
import { weeklyProgress } from '../lib/habitStats'
import HabitCheckButton from './HabitCheckButton.vue'

/** Days of history in the tile's mini heatmap — a 10x3 block ending today. */
const TILE_DAYS = 30

const { item } = defineProps<{ item: HabitTodayItem }>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'open-details': [habit: DbHabit]
}>()

const { t } = useI18n()

const days = computed(() =>
  buildCompactHabitGrid(item.habit, item.entries, Date.now())
    .flat()
    .filter((day) => !day.isFuture)
    .slice(-TILE_DAYS),
)

const gridSummary = computed(() =>
  t('habits.gridSummary', {
    name: item.habit.name,
    count: days.value.filter((day) => day.state === 'complete').length,
    days: days.value.length,
  }),
)

const progress = computed(() => weeklyProgress(item.habit, item.entries, Date.now()))

const toggleLabel = computed(() =>
  item.isComplete
    ? t('habits.markIncomplete', { name: item.habit.name })
    : t('habits.markComplete', { name: item.habit.name }),
)
</script>

<template>
  <article
    :data-testid="`habit-today-${item.habit.name}`"
    :data-habit-accent="item.habit.accent"
    class="flex flex-col rounded-2xl border bg-card p-4 shadow-sm"
  >
    <div class="flex items-start justify-between gap-2">
      <button
        type="button"
        class="min-w-0 flex-1 text-left"
        :aria-label="t('habits.showDetailsFor', { name: item.habit.name })"
        @click="emit('open-details', item.habit)"
      >
        <span class="block truncate font-semibold">{{ item.habit.name }}</span>
        <span class="mt-0.5 block text-xs text-muted-foreground">
          {{ t('common.dashboard.last30Days') }}
        </span>
      </button>
      <!-- Same guard as the old home rows: a quantity habit gets no one-tap
           control here — a stray tap would log a full day's target with no
           stepper, no confirmation, and no undo. -->
      <HabitCheckButton
        v-if="item.habit.kind.type === 'binary'"
        :pressed="item.isComplete"
        size="sm"
        :label="toggleLabel"
        @toggle="emit('toggle', item.habit)"
      />
    </div>

    <div role="img" :aria-label="gridSummary" class="mt-3 grid grid-cols-10 gap-1">
      <span
        v-for="day in days"
        :key="day.date"
        aria-hidden="true"
        class="aspect-square min-w-0 rounded-[3px]"
        :class="habitDayCellClass(day)"
      />
    </div>

    <span class="mt-3 flex items-center justify-between gap-2 border-t pt-3">
      <span class="text-sm font-semibold">{{ t('habits.weekProgressLabel', progress) }}</span>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </span>
  </article>
</template>
