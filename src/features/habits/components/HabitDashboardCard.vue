<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Archive, Check, ChevronDown, ChevronUp, Flame, Pencil } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import { useHabitStats } from '../composables/useHabitStats'
import HabitCompactGrid from './HabitCompactGrid.vue'
import HabitHistoryGrid from './HabitHistoryGrid.vue'
import HabitStatsSummary from './HabitStatsSummary.vue'

const { habit, entries } = defineProps<{
  habit: DbHabit
  entries: ReadonlyArray<DbHabitEntry>
}>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'log-quantity': [habit: DbHabit, value: number]
  edit: [habit: DbHabit]
  archive: [habit: DbHabit]
  'toggle-day': [habit: DbHabit, date: number]
}>()

const { t } = useI18n()
const expanded = ref(false)
const { stats } = useHabitStats(
  () => habit,
  () => entries,
)

const todayEntry = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return entries.find((entry) => entry.date === today.getTime())
})
const value = computed(() => todayEntry.value?.value ?? 0)
const complete = computed(() =>
  habit.kind.type === 'binary' ? value.value >= 1 : value.value >= habit.kind.target,
)
const metadata = computed(() => {
  if (habit.schedule.type === 'weekly' && stats.value) {
    return t('habits.weekProgressLabel', stats.value.weeklyProgress)
  }
  return stats.value && stats.value.currentStreak >= 2
    ? t('habits.streakLabel', { count: stats.value.currentStreak })
    : t('habits.schedule.daily')
})
const quantityPercent = computed(() => {
  if (habit.kind.type !== 'quantity' || habit.kind.target <= 0) return 0
  return Math.min(100, Math.round((value.value / habit.kind.target) * 100))
})

function handleEdit(): void {
  expanded.value = false
  emit('edit', habit)
}

function handleArchive(): void {
  emit('archive', habit)
}
</script>

<template>
  <article
    :data-testid="`habit-today-${habit.name}`"
    :data-habit-accent="habit.accent"
    class="overflow-hidden rounded-xl border bg-card shadow-sm"
  >
    <div class="space-y-3 p-4">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 text-2xl" aria-hidden="true">{{ habit.icon ?? '📌' }}</span>
        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          :aria-label="expanded ? t('habits.hideDetails') : t('habits.showDetails')"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          <span class="flex items-center gap-1 font-semibold">
            <span class="truncate">{{ habit.name }}</span>
            <ChevronUp v-if="expanded" class="size-4 shrink-0 text-muted-foreground" />
            <ChevronDown v-else class="size-4 shrink-0 text-muted-foreground" />
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
          v-if="habit.kind.type === 'binary'"
          size="icon"
          variant="outline"
          class="size-touch-target shrink-0 rounded-full border-2"
          :class="complete ? 'habit-today-complete' : 'habit-today-incomplete'"
          :aria-pressed="complete"
          :aria-label="
            complete
              ? t('habits.markIncomplete', { name: habit.name })
              : t('habits.markComplete', { name: habit.name })
          "
          @click="emit('toggle', habit)"
        >
          <Check v-if="complete" class="size-5" />
        </Button>
      </div>

      <div
        v-if="habit.kind.type === 'quantity'"
        class="flex items-center gap-3 rounded-lg bg-muted/60 p-2 pl-3"
      >
        <span class="text-sm font-medium tabular-nums">
          {{
            t('habits.quantityLabel', { value, target: habit.kind.target, unit: habit.kind.unit })
          }}
        </span>
        <Label :for="`habit-quantity-${habit.id}`" class="sr-only">
          {{ t('habits.quantityInputLabel', { name: habit.name }) }}
        </Label>
        <NumberField
          :id="`habit-quantity-${habit.id}`"
          class="ml-auto w-32"
          :model-value="value"
          :min="0"
          :max="9999"
          :step="1"
          @update:model-value="(next) => emit('log-quantity', habit, next)"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput class="text-center" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>
      <Progress v-if="habit.kind.type === 'quantity'" :model-value="quantityPercent" />

      <HabitCompactGrid :habit="habit" :entries="entries" />
    </div>

    <div v-if="expanded && stats" class="space-y-4 border-t bg-muted/20 p-4">
      <HabitStatsSummary :stats="stats" />
      <HabitHistoryGrid
        :grid="stats.grid"
        :habit-name="habit.name"
        @toggle-day="(date) => emit('toggle-day', habit, date)"
      />
      <div class="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          :aria-label="t('habits.editLabel', { name: habit.name })"
          @click="handleEdit"
        >
          <Pencil class="mr-1 size-4" />{{ t('habits.edit') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :aria-label="t('habits.archiveLabel', { name: habit.name })"
          @click="handleArchive"
        >
          <Archive class="mr-1 size-4" />{{ t('habits.archive') }}
        </Button>
      </div>
    </div>
  </article>
</template>
