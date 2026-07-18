<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Archive, ChevronDown, ChevronUp, Pencil } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import { useHabitStats } from '../composables/useHabitStats'
import HabitHistoryGrid from './HabitHistoryGrid.vue'
import HabitStatsSummary from './HabitStatsSummary.vue'

const { habit, entries } = defineProps<{
  habit: DbHabit
  entries: ReadonlyArray<DbHabitEntry>
}>()

const emit = defineEmits<{
  edit: [habit: DbHabit]
  archive: [habit: DbHabit]
  'toggle-day': [habit: DbHabit, date: number]
}>()

const { t } = useI18n()
const { stats } = useHabitStats(
  () => habit,
  () => entries,
)

const expanded = ref(false)

function toggleExpanded() {
  expanded.value = !expanded.value
}

const scheduleSummary = (h: DbHabit) =>
  h.schedule.type === 'weekly'
    ? `${t('habits.schedule.weekly')} · ${h.schedule.targetDaysPerWeek}x`
    : t('habits.schedule.daily')

const kindSummary = (h: DbHabit) =>
  h.kind.type === 'quantity'
    ? `${t('habits.kind.quantity')} · ${h.kind.target} ${h.kind.unit}`
    : t('habits.kind.binary')
</script>

<template>
  <div class="rounded-lg border bg-card" :data-testid="`habit-item-${habit.name}`">
    <div class="flex items-center gap-3 px-4 py-3">
      <span class="text-xl" aria-hidden="true">{{ habit.icon ?? '📌' }}</span>
      <div class="flex-1 min-w-0">
        <p class="font-medium truncate">{{ habit.name }}</p>
        <p class="text-xs text-muted-foreground">
          {{ scheduleSummary(habit) }} · {{ kindSummary(habit) }}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('habits.editLabel', { name: habit.name })"
        @click="emit('edit', habit)"
      >
        <Pencil class="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('habits.archiveLabel', { name: habit.name })"
        @click="emit('archive', habit)"
      >
        <Archive class="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="expanded ? t('habits.hideDetails') : t('habits.showDetails')"
        :aria-expanded="expanded"
        @click="toggleExpanded"
      >
        <ChevronUp v-if="expanded" class="h-4 w-4" />
        <ChevronDown v-else class="h-4 w-4" />
      </Button>
    </div>

    <div v-if="expanded && stats" class="space-y-3 border-t px-4 py-3">
      <HabitStatsSummary :stats="stats" />
      <HabitHistoryGrid
        :grid="stats.grid"
        :habit-name="habit.name"
        @toggle-day="(date) => emit('toggle-day', habit, date)"
      />
    </div>
  </div>
</template>
