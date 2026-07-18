<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Check, Flame } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import type { DbHabit, HabitKind } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'

/** Streaks shorter than this aren't worth a badge -- 1 day isn't a "streak" yet. */
const STREAK_BADGE_THRESHOLD = 2

const { items } = defineProps<{
  items: ReadonlyArray<HabitTodayItem>
}>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'log-quantity': [habit: DbHabit, value: number]
}>()

const { t } = useI18n()

/**
 * Takes the already-narrowed `quantity` kind rather than the whole
 * `HabitTodayItem` -- the only call site is the `v-else` (non-binary) branch
 * below, where `item.habit.kind` is provably the quantity variant, so there
 * is no `kind.type !== 'quantity'` case left to guard against here.
 */
function quantityPercent(kind: Extract<HabitKind, { type: 'quantity' }>, value: number): number {
  if (kind.target <= 0) return 0
  return Math.min(100, Math.round((value / kind.target) * 100))
}

function handleQuantityChange(item: HabitTodayItem, value: number) {
  emit('log-quantity', item.habit, value)
}
</script>

<template>
  <div v-if="items.length === 0" class="py-6 text-center text-sm text-muted-foreground">
    {{ t('habits.todayEmptyState') }}
  </div>

  <ul v-else role="list" class="space-y-2">
    <li
      v-for="item in items"
      :key="item.habit.id"
      role="listitem"
      :data-testid="`habit-today-${item.habit.name}`"
    >
      <!-- Binary: whole row is the tap target -->
      <button
        v-if="item.habit.kind.type === 'binary'"
        type="button"
        class="flex w-full min-h-16 items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors active:scale-[0.99]"
        :class="item.isComplete ? 'border-primary bg-primary/5' : 'hover:bg-accent'"
        :aria-pressed="item.isComplete"
        :aria-label="
          item.isComplete
            ? t('habits.markIncomplete', { name: item.habit.name })
            : t('habits.markComplete', { name: item.habit.name })
        "
        @click="emit('toggle', item.habit)"
      >
        <span class="text-2xl" aria-hidden="true">{{ item.habit.icon ?? '✅' }}</span>
        <span class="flex-1 min-w-0">
          <span class="block font-medium truncate">{{ item.habit.name }}</span>
          <span v-if="item.weekProgress" class="block text-xs text-muted-foreground">
            {{ t('habits.weekProgressLabel', item.weekProgress) }}
          </span>
        </span>
        <Badge v-if="item.streak >= STREAK_BADGE_THRESHOLD" variant="secondary">
          <Flame class="h-3 w-3 text-orange-500" aria-hidden="true" />
          {{ t('habits.streakLabel', { count: item.streak }) }}
        </Badge>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
          :class="
            item.isComplete
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30'
          "
        >
          <Check v-if="item.isComplete" class="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      <!-- Quantity: progress + inline stepper -->
      <div v-else class="space-y-2 rounded-lg border bg-card px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">{{ item.habit.icon ?? '📊' }}</span>
          <span class="flex-1 min-w-0">
            <span class="block font-medium truncate">{{ item.habit.name }}</span>
            <span class="block text-xs text-muted-foreground">
              {{
                t('habits.quantityLabel', {
                  value: item.value,
                  target: item.habit.kind.target,
                  unit: item.habit.kind.unit,
                })
              }}
              <template v-if="item.weekProgress">
                · {{ t('habits.weekProgressLabel', item.weekProgress) }}
              </template>
            </span>
          </span>
          <Badge v-if="item.streak >= STREAK_BADGE_THRESHOLD" variant="secondary">
            <Flame class="h-3 w-3 text-orange-500" aria-hidden="true" />
            {{ t('habits.streakLabel', { count: item.streak }) }}
          </Badge>
        </div>

        <Progress :model-value="quantityPercent(item.habit.kind, item.value)" />

        <!-- Accessible name comes from an associated Label (like WeightEntryForm's
             weight-input) rather than an `aria-label` prop -- NumberFieldRoot only
             threads `id` down to the actual <input>, so an aria-label placed on the
             root component lands on its wrapper div, not the spinbutton itself. -->
        <Label :for="`habit-quantity-${item.habit.id}`" class="sr-only">
          {{ t('habits.quantityInputLabel', { name: item.habit.name }) }}
        </Label>
        <NumberField
          :id="`habit-quantity-${item.habit.id}`"
          :model-value="item.value"
          :min="0"
          :max="9999"
          :step="1"
          @update:model-value="(value) => handleQuantityChange(item, value)"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput class="text-center" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>
    </li>
  </ul>
</template>
