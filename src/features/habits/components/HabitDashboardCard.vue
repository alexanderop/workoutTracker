<script setup lang="ts">
/**
 * `cards` mode: the roomiest layout, and the default for a user who has never
 * picked one.
 *
 * It still shows what it always did -- icon, name, check control or quantity
 * stepper, 16-week heatmap, streak -- but no longer owns the detail view:
 * stats, history retro-toggle, Edit and Archive moved to `HabitDetailSheet`,
 * which every mode opens, so there is one detail surface rather than one per
 * layout.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Flame } from '@lucide/vue'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import { useHabitStats } from '../composables/useHabitStats'
import HabitCheckButton from './HabitCheckButton.vue'
import HabitCompactGrid from './HabitCompactGrid.vue'
import HabitQuantityControl from './HabitQuantityControl.vue'
import { AppIcon } from '@/components/app-icons'
import { resolveHabitIcon } from '../lib/habitIcons'

const { item } = defineProps<{ item: HabitTodayItem }>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'log-quantity': [habit: DbHabit, value: number]
  'open-details': [habit: DbHabit]
}>()

const { t } = useI18n()

// Read off the single `item` prop -- `value` and `isComplete` arrive
// pre-derived rather than being recomputed from entries a second time, so they
// are used directly. `habit` is aliased only because the template names it a
// dozen times.
const habit = computed(() => item.habit)
const { stats } = useHabitStats(
  () => item.habit,
  () => item.entries,
)

const hasStreak = computed(() => (stats.value?.currentStreak ?? 0) >= 2)

const metadata = computed(() => {
  if (habit.value.schedule.type === 'weekly' && stats.value) {
    return t('habits.weekProgressLabel', stats.value.weeklyProgress)
  }
  return stats.value && hasStreak.value
    ? t('habits.streakLabel', { count: stats.value.currentStreak })
    : t('habits.schedule.daily')
})
</script>

<template>
  <article
    :data-testid="`habit-today-${habit.name}`"
    :data-habit-accent="habit.accent"
    class="overflow-hidden rounded-2xl border bg-card shadow-sm"
  >
    <div class="space-y-3 p-4">
      <!-- Icon, name and tick on one baseline, the heatmap edge-to-edge below,
           the streak trailing under it. The icon sits in an accent-tinted tile
           rather than floating on the card: it is the only place the habit's
           colour appears above the fold, and a bare glyph left every card
           looking alike until you read the name. -->
      <div class="flex items-center gap-3">
        <span
          class="habit-accent-tint habit-accent-fg flex size-11 shrink-0 items-center justify-center rounded-xl"
        >
          <AppIcon :name="resolveHabitIcon(habit.icon)" class="size-6" />
        </span>
        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          :aria-label="t('habits.showDetailsFor', { name: habit.name })"
          @click="emit('open-details', habit)"
        >
          <span class="flex items-center gap-1 text-base font-semibold">
            <span class="truncate">{{ habit.name }}</span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </span>
          <span v-if="habit.description" class="block truncate text-sm text-muted-foreground">
            {{ habit.description }}
          </span>
        </button>

        <HabitCheckButton
          :pressed="item.isComplete"
          size="lg"
          :label="
            item.isComplete
              ? t('habits.markIncomplete', { name: habit.name })
              : t('habits.markComplete', { name: habit.name })
          "
          @toggle="emit('toggle', habit)"
        />
      </div>

      <HabitQuantityControl
        :habit="habit"
        :value="item.value"
        scope="card"
        @update:value="(next) => emit('log-quantity', habit, next)"
      />

      <HabitCompactGrid :habit="habit" :entries="item.entries" />

      <!-- Streak reads as a badge under the grid rather than as a third line of
           metadata under the name: it is a result of the grid, and putting it
           there keeps the header to one line however long the habit's name and
           description are. -->
      <div class="flex justify-end">
        <span
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          :class="
            hasStreak ? 'habit-accent-tint text-foreground' : 'bg-muted text-muted-foreground'
          "
        >
          <Flame v-if="hasStreak" class="size-3.5 text-highlight" />
          {{ metadata }}
        </span>
      </div>
    </div>
  </article>
</template>
