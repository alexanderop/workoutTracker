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

/**
 * Six weeks of history: 7 rows x 6 columns.
 *
 * More columns makes the tile *shorter*, not taller -- the cells are square and
 * sized by tile width / columns, so six columns give 12.7px cells over five's
 * 16px, and the seven-row block loses ~23px of height. That is what keeps seven
 * habits inside a phone viewport once the name has its own row, and it buys a
 * week more history rather than costing one.
 */
const TILE_DAYS = 42

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
      class="flex flex-col gap-1.5 rounded-xl border bg-card p-1.5 shadow-sm"
    >
      <!-- Check and icon share the top row; the name gets a row to itself.
           Sharing one row with a 32px control and a 14px icon left the name
           about four characters of a ~10rem tile, which turned "Meditate" and
           "Medication" into the same "Medi…". On its own row it has the full
           tile width, which is what the truncation decision assumed. -->
      <div class="flex items-center justify-between gap-1">
        <Button
          size="icon"
          variant="outline"
          class="size-touch-target shrink-0 rounded-lg border-2"
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
        <AppIcon :name="resolveHabitIcon(item.habit.icon)" class="size-4 shrink-0 opacity-70" />
      </div>

      <!-- The heatmap sits *inside* the details button rather than beside it.
           A tile is only ~130px tall and the grid has ~26px of slack at seven
           habits, so growing a text-sized button to the 44px touch floor would
           push the last row off screen. Wrapping the name, month and heatmap
           gives a tap area far past 44px and costs no height. Safe to nest: the
           heatmap is `role="img"` with aria-hidden cells and no controls of its
           own (HabitCompactGrid). -->
      <button
        type="button"
        class="min-w-0 flex flex-col gap-1 text-left"
        :aria-label="t('habits.showDetailsFor', { name: item.habit.name })"
        @click="emit('open-details', item.habit)"
      >
        <span class="block w-full truncate text-xs font-medium" data-testid="habit-tile-name">
          {{ item.habit.name }}
        </span>
        <span class="block w-full truncate text-[0.625rem] text-muted-foreground">
          {{ monthLabel }}
        </span>
        <HabitCompactGrid
          class="w-full"
          :habit="item.habit"
          :entries="item.entries"
          :days="TILE_DAYS"
        />
      </button>
    </article>
  </div>
</template>
