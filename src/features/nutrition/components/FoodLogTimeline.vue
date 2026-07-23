<script setup lang="ts">
import { Plus, Trash2, Utensils } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import { useNutritionFormats } from '../composables/useNutritionFormats'
import {
  groupEntriesByHour,
  isLoggedOnDiaryDay,
  mealForHour,
  timelineHours,
} from '../lib/foodLogTimeline'
import { scaleNutrients } from '../lib/nutritionCalculations'

const { entries } = defineProps<{
  entries: ReadonlyArray<DbNutritionDiaryEntry>
}>()

const emit = defineEmits<{
  add: [meal: MealKind]
  remove: [entry: DbNutritionDiaryEntry]
}>()

const { t } = useI18n()
const { timeLabel, hourLabel, macroSummary } = useNutritionFormats()

const groups = computed(() => groupEntriesByHour(entries))
const groupsByHour = computed(() => new Map(groups.value.map((group) => [group.hour, group])))
const hourRows = computed(() =>
  timelineHours(groups.value).map((hour) => ({ hour, group: groupsByHour.value.get(hour) })),
)

function entryTimeLabel(entry: DbNutritionDiaryEntry): string {
  return isLoggedOnDiaryDay(entry)
    ? timeLabel(new Date(entry.loggedAt))
    : t(`nutrition.meals.${entry.meal}`)
}

function entrySummary(entry: DbNutritionDiaryEntry): string {
  const scaled = scaleNutrients(entry.foodSnapshot.nutrientsPer100Grams, entry.grams)
  return `${macroSummary(scaled)} · ${entry.grams}${t('nutrition.gramsUnit')}`
}
</script>

<template>
  <ol class="relative" data-testid="food-log-timeline">
    <!-- Vertical timeline rail behind the hour chips. -->
    <div class="absolute bottom-2 left-[34px] top-2 w-px bg-border" aria-hidden="true" />
    <li v-for="row in hourRows" :key="row.hour" class="relative flex gap-3 py-1.5">
      <div class="z-10 flex w-[68px] shrink-0 items-start justify-center pt-1">
        <span
          class="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground"
        >
          {{ hourLabel(row.hour) }}
        </span>
      </div>

      <div class="min-w-0 flex-1 pr-1">
        <div class="flex min-h-9 items-center justify-between gap-2">
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            :aria-label="t('nutrition.foodLog.addAtHour', { hour: hourLabel(row.hour) })"
            @click="emit('add', mealForHour(row.hour))"
          >
            <Plus class="size-4" aria-hidden="true" />
          </button>
          <p
            v-if="row.group"
            class="truncate text-xs font-medium tabular-nums text-muted-foreground"
          >
            {{ macroSummary(row.group.totals) }}
          </p>
        </div>

        <ul v-if="row.group" class="mt-1 space-y-2 pb-1" role="list">
          <li
            v-for="entry in row.group.entries"
            :key="entry.id"
            class="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"
            >
              <Utensils class="size-4 text-primary" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{{ entry.foodSnapshot.name }}</p>
              <p class="truncate text-xs tabular-nums text-muted-foreground">
                {{ entryTimeLabel(entry) }} · {{ entrySummary(entry) }}
              </p>
            </div>
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              :aria-label="t('nutrition.deleteFood', { name: entry.foodSnapshot.name })"
              @click="emit('remove', entry)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>
    </li>
  </ol>
</template>
