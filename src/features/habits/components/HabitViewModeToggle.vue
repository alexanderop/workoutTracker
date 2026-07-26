<script setup lang="ts">
/**
 * Which layout `/habits` renders. Icon-only and inline on the page title row:
 * the reference app floats this bottom-centre, but `Layout.vue` already puts a
 * sticky 5-slot nav there and a floating pill would land on the "+" quick-add
 * button.
 *
 * Icon-only means the accessible name carries the whole meaning, so every
 * option is labelled in both locales.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LayoutGrid, Rows3, StretchHorizontal } from '@lucide/vue'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { HABIT_VIEW_MODES } from '@/db/schema'
import type { HabitViewMode } from '@/db/schema'

const mode = defineModel<HabitViewMode>({ required: true })

const { t } = useI18n()

const ICONS = {
  grid: LayoutGrid,
  rows: Rows3,
  cards: StretchHorizontal,
} as const satisfies Record<HabitViewMode, unknown>

const options = computed(() =>
  HABIT_VIEW_MODES.map((value) => ({
    value,
    icon: ICONS[value],
    label: t(`habits.viewMode.${value}`),
  })),
)

/**
 * ToggleGroup emits `''` when the active item is tapped again (deselect). A
 * layout is not optional -- there is no "no view" state -- so re-tapping the
 * current mode is a no-op rather than a way to empty the page.
 */
function handleChange(next: unknown): void {
  if (typeof next !== 'string' || next === '') return
  const match = HABIT_VIEW_MODES.find((candidate) => candidate === next)
  if (match) mode.value = match
}
</script>

<template>
  <ToggleGroup
    type="single"
    :model-value="mode"
    variant="outline"
    size="sm"
    :aria-label="t('habits.viewMode.label')"
    data-testid="habit-view-mode-toggle"
    @update:model-value="handleChange"
  >
    <ToggleGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :aria-label="option.label"
      :data-testid="`habit-view-mode-${option.value}`"
    >
      <component :is="option.icon" class="size-4" />
    </ToggleGroupItem>
  </ToggleGroup>
</template>
