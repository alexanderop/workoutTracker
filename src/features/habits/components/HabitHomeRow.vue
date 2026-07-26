<script setup lang="ts">
import { Check } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import HabitCompactGrid from './HabitCompactGrid.vue'
import { AppIcon } from '@/components/app-icons'
import { resolveHabitIcon } from '../lib/habitIcons'
import { HABIT_ROW_DAYS, HABIT_ROW_GRID_COLUMNS } from '../lib/rowLayout'
import type { HabitRowDensity } from '../lib/rowLayout'

const { item, tapTargets = 'compact' } = defineProps<{
  item: HabitTodayItem
  /**
   * `comfortable` grows the controls to the app's 44px touch floor, for the
   * `/habits` rows layout where these are the primary logging targets.
   *
   * `compact` is the default so the home card -- a four-row glance surface that
   * this plan deliberately left alone, and whose appearance a visual-regression
   * baseline pins -- keeps the sizing it already had. Growing it there is a
   * worthwhile follow-up, but it needs a regenerated macOS baseline.
   */
  tapTargets?: HabitRowDensity
}>()

const comfortable = tapTargets === 'comfortable'
const gridColumns = HABIT_ROW_GRID_COLUMNS[tapTargets]

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'open-details': [habit: DbHabit]
}>()
const { t } = useI18n()
</script>

<template>
  <div
    :data-testid="`habit-today-${item.habit.name}`"
    :data-habit-accent="item.habit.accent"
    class="grid items-center gap-3 rounded-lg border bg-card p-3"
    :class="gridColumns"
  >
    <AppIcon :name="resolveHabitIcon(item.habit.icon)" class="size-6 shrink-0" />
    <!-- `touch-target` gives the tap area a 44px floor instead of letting it be
         however tall the habit's name happens to render. -->
    <button
      type="button"
      class="min-w-0 flex flex-col justify-center text-left"
      :class="comfortable && 'touch-target'"
      :aria-label="t('habits.showDetailsFor', { name: item.habit.name })"
      @click="emit('open-details', item.habit)"
    >
      <span class="block truncate text-sm font-medium">{{ item.habit.name }}</span>
      <span
        v-if="item.habit.kind.type === 'quantity'"
        class="block truncate text-xs text-muted-foreground"
      >
        {{
          t('habits.quantityLabel', {
            value: item.value,
            target: item.habit.kind.target,
            unit: item.habit.kind.unit,
          })
        }}
      </span>
    </button>
    <HabitCompactGrid :habit="item.habit" :entries="item.entries" :days="HABIT_ROW_DAYS" />
    <!-- Quantity habits get a tap-to-target control only in the `comfortable`
         (`/habits` rows) layout. On the home card a stray tap would write a full
         day's quantity -- 3 of 3 L -- with no stepper, no confirmation and no
         undo, on a glance surface that never offered the control before. Binary
         habits keep it everywhere, as they always had. -->
    <Button
      v-if="comfortable || item.habit.kind.type === 'binary'"
      size="icon"
      variant="outline"
      class="shrink-0 rounded-full border-2"
      :class="[
        comfortable && 'size-touch-target',
        item.isComplete ? 'habit-today-complete' : 'habit-today-incomplete',
      ]"
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
    <span v-else aria-hidden="true" class="size-9" />
  </div>
</template>
