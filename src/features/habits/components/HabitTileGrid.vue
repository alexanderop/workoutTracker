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
 * The mini heatmap is a five-week window against the card's sixteen -- five
 * columns of seven is what fits the tile without the cells becoming untappable
 * specks. The month label exists because a heatmap this small has no other
 * time anchor.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { AppIcon } from '@/components/app-icons'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import { resolveHabitIcon } from '../lib/habitIcons'
import HabitCompactGrid from './HabitCompactGrid.vue'

/** Five weeks of history: 7 rows x 5 columns at ~10rem wide. */
const TILE_DAYS = 35

defineProps<{ items: ReadonlyArray<HabitTodayItem> }>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'open-details': [habit: DbHabit]
}>()

const { t, locale } = useI18n()

const monthLabel = computed(() =>
  new Date().toLocaleDateString(locale.value, { month: 'short', year: 'numeric' }),
)
</script>

<template>
  <div class="grid grid-cols-3 gap-2" data-testid="habit-tile-grid">
    <article
      v-for="item in items"
      :key="item.habit.id"
      :data-testid="`habit-today-${item.habit.name}`"
      :data-habit-accent="item.habit.accent"
      class="flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm"
    >
      <div class="flex items-start gap-1.5">
        <Button
          size="icon"
          variant="outline"
          class="size-8 shrink-0 rounded-lg border-2"
          :class="item.isComplete ? 'habit-today-complete' : 'habit-today-incomplete'"
          :aria-pressed="item.isComplete"
          :aria-label="
            item.isComplete
              ? t('habits.markIncomplete', { name: item.habit.name })
              : t('habits.markComplete', { name: item.habit.name })
          "
          @click="emit('toggle', item.habit)"
        >
          <Check v-if="item.isComplete" class="size-4" />
        </Button>

        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          :aria-label="t('habits.showDetailsFor', { name: item.habit.name })"
          @click="emit('open-details', item.habit)"
        >
          <span class="flex items-center gap-1">
            <AppIcon :name="resolveHabitIcon(item.habit.icon)" class="size-3.5 shrink-0" />
            <span class="min-w-0 truncate text-xs font-medium">{{ item.habit.name }}</span>
          </span>
          <span class="block truncate text-[0.625rem] text-muted-foreground">
            {{ monthLabel }}
          </span>
        </button>
      </div>

      <HabitCompactGrid :habit="item.habit" :entries="item.entries" :days="TILE_DAYS" />
    </article>
  </div>
</template>
