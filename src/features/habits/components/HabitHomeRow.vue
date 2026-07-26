<script setup lang="ts">
import { Check } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import HabitCompactGrid from './HabitCompactGrid.vue'
import { AppIcon } from '@/components/app-icons'
import { resolveHabitIcon } from '../lib/habitIcons'

const { item } = defineProps<{ item: HabitTodayItem }>()

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
    class="grid grid-cols-[auto_minmax(0,1fr)_5.5rem_auto] items-center gap-3 rounded-lg border bg-card p-3"
  >
    <AppIcon :name="resolveHabitIcon(item.habit.icon)" class="size-6 shrink-0" />
    <button
      type="button"
      class="min-w-0 text-left"
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
    <HabitCompactGrid :habit="item.habit" :entries="item.entries" :days="7" />
    <Button
      size="icon"
      variant="outline"
      class="rounded-full border-2"
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
  </div>
</template>
