<script setup lang="ts">
/**
 * Exact-quantity logging for a quantity habit: today's value against its
 * target, a stepper, and a progress bar.
 *
 * Shared by `cards` mode's dashboard card and the detail sheet, which render it
 * identically -- it existed once in each, along with a copy of the same
 * `quantityPercent` clamp, and a third copy lived in the list component this
 * feature deleted. One control, one place to change it.
 *
 * Renders nothing for a binary habit, so a caller that has a plain `DbHabit`
 * needs no `v-if` of its own. Two root nodes rather than a wrapper `div`: the
 * row and the bar are laid out by the caller's own vertical rhythm
 * (`space-y-*`), exactly as they were when this markup was inline.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import type { DbHabit } from '@/db/schema'

const { habit, value } = defineProps<{ habit: DbHabit; value: number }>()

const emit = defineEmits<{ 'update:value': [value: number] }>()

const { t } = useI18n()

const kind = computed(() => (habit.kind.type === 'quantity' ? habit.kind : undefined))

const percent = computed(() => {
  const target = kind.value?.target ?? 0
  if (target <= 0) return 0
  return Math.min(100, Math.round((value / target) * 100))
})
</script>

<template>
  <div v-if="kind" class="flex items-center gap-3 rounded-lg bg-muted/60 p-2 pl-3">
    <span class="text-sm font-medium tabular-nums">
      {{ t('habits.quantityLabel', { value, target: kind.target, unit: kind.unit }) }}
    </span>
    <!-- Accessible name comes from an associated Label rather than an
         `aria-label` prop: NumberFieldRoot only threads `id` down to the actual
         <input>, so an aria-label on the root lands on its wrapper div and the
         spinbutton itself stays unnamed. -->
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
      @update:model-value="(next) => emit('update:value', next)"
    >
      <NumberFieldContent>
        <NumberFieldDecrement />
        <NumberFieldInput class="text-center" />
        <NumberFieldIncrement />
      </NumberFieldContent>
    </NumberField>
  </div>
  <Progress v-if="kind" :model-value="percent" />
</template>
