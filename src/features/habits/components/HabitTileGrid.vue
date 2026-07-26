<script setup lang="ts">
/**
 * `grid` mode: 3-up tiles, the densest layout -- built for "tick everything
 * off" rather than for reading history.
 *
 * Three columns inside the page's `max-w-lg` container leave roughly 10rem per
 * tile, so the habit name truncates rather than the tile shrinking to fit. That
 * is a deliberate trade: at seven habits this is the only layout that fits the
 * whole list on a phone without scrolling.
 *
 * The mini heatmap is one calendar month laid out a week per row
 * (`HabitMonthGrid`), which is also what the month caption above it has always
 * claimed to be showing.
 */
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/components/app-icons'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import { resolveHabitIcon } from '../lib/habitIcons'
import HabitCheckButton from './HabitCheckButton.vue'
import HabitMonthGrid from './HabitMonthGrid.vue'

defineProps<{ items: ReadonlyArray<HabitTodayItem> }>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'open-details': [habit: DbHabit]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-3 gap-2" data-testid="habit-tile-grid">
    <article
      v-for="item in items"
      :key="item.habit.id"
      :data-testid="`habit-today-${item.habit.name}`"
      :data-habit-accent="item.habit.accent"
      class="flex flex-col gap-1.5 rounded-xl border bg-card p-1.5 shadow-sm"
    >
      <!-- Check and icon share the top row; the name gets a row to itself.
           Sharing one row with a 44px control and a 14px icon left the name
           about four characters of a ~10rem tile, which turned "Meditate" and
           "Medication" into the same "Medi…". On its own row it has the full
           tile width, which is what the truncation decision assumed. -->
      <div class="flex items-center justify-between gap-1">
        <HabitCheckButton
          :pressed="item.isComplete"
          :label="
            item.isComplete
              ? t('habits.markIncomplete', { name: item.habit.name })
              : t('habits.markComplete', { name: item.habit.name })
          "
          @toggle="emit('toggle', item.habit)"
        />
        <span
          class="habit-accent-tint habit-accent-fg flex size-7 shrink-0 items-center justify-center rounded-lg"
        >
          <AppIcon :name="resolveHabitIcon(item.habit.icon)" class="size-4" />
        </span>
      </div>

      <!-- The heatmap sits *inside* the details button rather than beside it.
           A tile is only ~130px tall and the grid has ~26px of slack at seven
           habits, so growing a text-sized button to the 44px touch floor would
           push the last row off screen. Wrapping the name, month and heatmap
           gives a tap area far past 44px and costs no height. Safe to nest: the
           heatmap is `role="img"` with aria-hidden cells and no controls of its
           own (HabitMonthGrid). -->
      <button
        type="button"
        class="min-w-0 flex flex-col gap-1 text-left"
        :aria-label="t('habits.showDetailsFor', { name: item.habit.name })"
        @click="emit('open-details', item.habit)"
      >
        <span class="block w-full truncate text-xs font-medium" data-testid="habit-tile-name">
          {{ item.habit.name }}
        </span>
        <HabitMonthGrid class="w-full" :habit="item.habit" :entries="item.entries" />
      </button>
    </article>
  </div>
</template>
