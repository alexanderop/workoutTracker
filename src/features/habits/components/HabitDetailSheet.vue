<script setup lang="ts">
/**
 * The single detail surface for a habit, reachable identically from all three
 * layouts.
 *
 * It exists because the dense layouts have no room to inline what the card
 * used to expand into, and a user who persists `grid` or `rows` must still be
 * able to edit, archive, retro-toggle a day, and enter an exact quantity --
 * otherwise their chosen mode is a dead end.
 *
 * Deliberately the *only* implementation: the card's inline expand region was
 * removed rather than kept alongside this, so there is one place to change
 * when the detail view changes.
 */
import { useI18n } from 'vue-i18n'
import { Archive, Pencil } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AppIcon } from '@/components/app-icons'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import { useHabitStats } from '../composables/useHabitStats'
import { resolveHabitIcon } from '../lib/habitIcons'
import HabitHistoryGrid from './HabitHistoryGrid.vue'
import HabitQuantityControl from './HabitQuantityControl.vue'
import HabitStatsSummary from './HabitStatsSummary.vue'

const open = defineModel<boolean>('open', { required: true })

const { item } = defineProps<{ item: HabitTodayItem | undefined }>()

const emit = defineEmits<{
  'log-quantity': [habit: DbHabit, value: number]
  'toggle-day': [habit: DbHabit, date: number]
  edit: [habit: DbHabit]
  archive: [habit: DbHabit]
}>()

const { t } = useI18n()

// `item` is undefined between closing the sheet and the next open; the stats
// composable is fed a stable fallback so it never sees a null habit.
const { stats } = useHabitStats(
  () => item?.habit,
  () => item?.entries ?? [],
)

// Every emit re-checks `item` rather than asserting it non-null off the
// template's `v-if`: these run from event handlers, where the prop could have
// been cleared since the render that produced the guard.
function handleLogQuantity(value: number): void {
  if (!item) return
  emit('log-quantity', item.habit, value)
}

function handleToggleDay(date: number): void {
  if (!item) return
  emit('toggle-day', item.habit, date)
}

function handleEdit(): void {
  if (!item) return
  open.value = false
  emit('edit', item.habit)
}

function handleArchive(): void {
  if (!item) return
  open.value = false
  emit('archive', item.habit)
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent v-if="item" side="bottom" class="max-h-[90vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <AppIcon :name="resolveHabitIcon(item.habit.icon)" class="size-6 shrink-0" />
          <span class="min-w-0 truncate">{{ item.habit.name }}</span>
        </SheetTitle>
        <SheetDescription>
          {{ item.habit.description || t('habits.detailsFor', { name: item.habit.name }) }}
        </SheetDescription>
      </SheetHeader>

      <div class="space-y-4 px-4 pb-4" data-testid="habit-detail-sheet">
        <div v-if="item.habit.kind.type === 'quantity'" class="space-y-2">
          <HabitQuantityControl
            :habit="item.habit"
            :value="item.value"
            scope="sheet"
            @update:value="handleLogQuantity"
          />
        </div>

        <template v-if="stats">
          <HabitStatsSummary :stats="stats" />
          <HabitHistoryGrid
            :grid="stats.grid"
            :habit-name="item.habit.name"
            @toggle-day="handleToggleDay"
          />
        </template>

        <div class="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            :aria-label="t('habits.editLabel', { name: item.habit.name })"
            @click="handleEdit"
          >
            <Pencil class="mr-1 size-4" />{{ t('habits.edit') }}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :aria-label="t('habits.archiveLabel', { name: item.habit.name })"
            @click="handleArchive"
          >
            <Archive class="mr-1 size-4" />{{ t('habits.archive') }}
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
