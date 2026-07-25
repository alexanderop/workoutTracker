<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { BarbellPlateHint } from '@/components/ui/barbell-hint'
import { useNumberLocale } from '@/composables/useNumberLocale'
import type { InputType } from './useNumericInput'
import type { WeightUnit } from '@/types/settings'
import type { Equipment } from '@/exercises/types'

type Props = {
  unit?: string
  allowDecimal?: boolean
  equipment?: Equipment
  inputType?: InputType
  weightUnit?: WeightUnit
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  allowDecimal: false,
  equipment: undefined,
  inputType: undefined,
  weightUnit: undefined,
})

const modelValue = defineModel<number>({ required: true })
const emit = defineEmits<{
  confirm: []
}>()

const { formatInputValue } = useNumberLocale()

// Show barbell hint only for barbell exercises when entering weight
const showBarbellHint = computed(
  () => props.equipment === 'barbell' && props.inputType === 'weight',
)
</script>

<template>
  <div class="flex items-center gap-3 border-t bg-background px-4 py-3">
    <!-- Barbell Plate Hint (for barbell exercises entering weight) -->
    <BarbellPlateHint
      v-if="showBarbellHint && weightUnit"
      :weight="modelValue"
      :unit="weightUnit"
      class="shrink-0"
    />

    <!-- Value Display -->
    <div
      role="status"
      aria-label="Current value"
      aria-live="polite"
      aria-atomic="true"
      class="flex h-14 flex-1 items-center justify-center rounded-lg bg-secondary/30"
    >
      <span class="text-3xl font-bold tabular-nums text-foreground">
        {{ formatInputValue(modelValue, allowDecimal) }}
      </span>
      <span v-if="unit" class="ml-2 text-lg text-muted-foreground">
        {{ unit }}
      </span>
    </div>

    <!-- Confirm Button -->
    <Button
      type="button"
      size="icon-lg"
      class="h-14 w-14 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      aria-label="Confirm value"
      data-testid="confirm-button"
      @click="emit('confirm')"
    >
      <Check class="h-6 w-6" stroke-width="3" />
    </Button>
  </div>
</template>
