<script setup lang="ts">
/**
 * `cards` mode: the roomiest layout, and the default for a user who has never
 * picked one.
 *
 * Everything above the fold is unchanged from when this was the only layout --
 * icon, name, metadata, check control or quantity stepper, 16-week heatmap.
 * What it no longer owns is the detail view: stats, history retro-toggle, Edit
 * and Archive moved to `HabitDetailSheet`, which every mode opens, so there is
 * one detail surface rather than one per layout.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ChevronRight, Flame } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import { useHabitStats } from '../composables/useHabitStats'
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

const metadata = computed(() => {
  if (habit.value.schedule.type === 'weekly' && stats.value) {
    return t('habits.weekProgressLabel', stats.value.weeklyProgress)
  }
  return stats.value && stats.value.currentStreak >= 2
    ? t('habits.streakLabel', { count: stats.value.currentStreak })
    : t('habits.schedule.daily')
})
</script>

<template>
  <article
    :data-testid="`habit-today-${habit.name}`"
    :data-habit-accent="habit.accent"
    class="overflow-hidden rounded-xl border bg-card shadow-sm"
  >
    <div class="space-y-3 p-4">
      <div class="flex items-start gap-3">
        <AppIcon :name="resolveHabitIcon(habit.icon)" class="mt-0.5 size-8 shrink-0" />
        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          :aria-label="t('habits.showDetailsFor', { name: habit.name })"
          @click="emit('open-details', habit)"
        >
          <span class="flex items-center gap-1 font-semibold">
            <span class="truncate">{{ habit.name }}</span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </span>
          <span v-if="habit.description" class="block truncate text-sm text-muted-foreground">
            {{ habit.description }}
          </span>
          <span class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Flame v-if="stats && stats.currentStreak >= 2" class="size-3 text-highlight" />
            {{ metadata }}
          </span>
        </button>

        <Button
          size="icon"
          variant="outline"
          class="size-touch-target shrink-0 rounded-full border-2"
          :class="item.isComplete ? 'habit-today-complete' : 'habit-today-incomplete'"
          :aria-pressed="item.isComplete"
          :aria-label="
            item.isComplete
              ? t('habits.markIncomplete', { name: habit.name })
              : t('habits.markComplete', { name: habit.name })
          "
          @click="emit('toggle', habit)"
        >
          <Check v-if="item.isComplete" class="size-5" />
        </Button>
      </div>

      <HabitQuantityControl
        :habit="habit"
        :value="item.value"
        @update:value="(next) => emit('log-quantity', habit, next)"
      />

      <HabitCompactGrid :habit="habit" :entries="item.entries" />
    </div>
  </article>
</template>
