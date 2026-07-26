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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Archive, Pencil } from '@lucide/vue'
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
const habit = computed(() => item?.habit)
const { stats } = useHabitStats(
  () => item?.habit,
  () => item?.entries ?? [],
)

const quantityPercent = computed(() => {
  const kind = habit.value?.kind
  if (kind?.type !== 'quantity' || kind.target <= 0) return 0
  return Math.min(100, Math.round(((item?.value ?? 0) / kind.target) * 100))
})

function handleEdit(): void {
  if (!habit.value) return
  open.value = false
  emit('edit', habit.value)
}

function handleArchive(): void {
  if (!habit.value) return
  open.value = false
  emit('archive', habit.value)
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent v-if="habit && item" side="bottom" class="max-h-[90vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <AppIcon :name="resolveHabitIcon(habit.icon)" class="size-6 shrink-0" />
          <span class="min-w-0 truncate">{{ habit.name }}</span>
        </SheetTitle>
        <SheetDescription>
          {{ habit.description || t('habits.detailsFor', { name: habit.name }) }}
        </SheetDescription>
      </SheetHeader>

      <div class="space-y-4 px-4 pb-4" data-testid="habit-detail-sheet">
        <div v-if="habit.kind.type === 'quantity'" class="space-y-2">
          <div class="flex items-center gap-3 rounded-lg bg-muted/60 p-2 pl-3">
            <span class="text-sm font-medium tabular-nums">
              {{
                t('habits.quantityLabel', {
                  value: item.value,
                  target: habit.kind.target,
                  unit: habit.kind.unit,
                })
              }}
            </span>
            <Label :for="`habit-quantity-${habit.id}`" class="sr-only">
              {{ t('habits.quantityInputLabel', { name: habit.name }) }}
            </Label>
            <NumberField
              :id="`habit-quantity-${habit.id}`"
              class="ml-auto w-32"
              :model-value="item.value"
              :min="0"
              :max="9999"
              :step="1"
              @update:model-value="(next) => emit('log-quantity', habit!, next)"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput class="text-center" />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
          </div>
          <Progress :model-value="quantityPercent" />
        </div>

        <template v-if="stats">
          <HabitStatsSummary :stats="stats" />
          <HabitHistoryGrid
            :grid="stats.grid"
            :habit-name="habit.name"
            @toggle-day="(date) => emit('toggle-day', habit!, date)"
          />
        </template>

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
    </SheetContent>
  </Sheet>
</template>
