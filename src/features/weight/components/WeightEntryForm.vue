<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { NumericInputModal } from '@/components/ui/numeric-input'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useTouchDevice } from '@/composables/useTouchDevice'
import { cn } from '@/lib/utils'

type Properties = {
  /** Last recorded weight in display units (kg or lbs), used to center presets */
  lastWeight?: number
}

const { lastWeight } = defineProps<Properties>()

const emit = defineEmits<{
  save: [weightKg: number]
}>()

const { t } = useI18n()
const { unitLabel, toStorageValue, toDisplayValue } = useWeightDisplay()
const { isTouchDevice } = useTouchDevice()

// Default center value for presets (80kg in display units)
const DEFAULT_CENTER_KG = 80
const defaultCenterValue = computed(() => toDisplayValue(DEFAULT_CENTER_KG) ?? DEFAULT_CENTER_KG)

// Input value in display units
const inputValue = ref<number>(lastWeight ?? defaultCenterValue.value)

// Sync inputValue when lastWeight prop becomes available (e.g., after navigation)
watch(
  () => lastWeight,
  (newValue) => {
    if (newValue !== undefined) {
      inputValue.value = newValue
    }
  },
)

// Modal state for touch devices
const modalOpen = ref(false)

function handleSave() {
  if (!isValid.value) return

  const kgValue = toStorageValue(inputValue.value)
  if (kgValue === undefined) return

  emit('save', kgValue)
  // Keep the entered value - no reset needed
  // On refresh, lastWeight prop will provide the latest saved value
}

function openModal() {
  modalOpen.value = true
}

const isValid = computed(() => {
  return inputValue.value !== undefined && inputValue.value > 0
})
</script>

<template>
  <div class="space-y-2">
    <!-- Visually hidden: the weight display/input below is self-describing via aria-label -->
    <Label for="weight-input" class="sr-only">{{ t('weight.enterWeight') }}</Label>

    <!-- Input and Save share one row to keep the entry form compact so
         trend/history stay visible without scrolling. -->
    <div class="flex items-center gap-2">
      <!-- Mobile: Tap to open fullscreen modal -->
      <button
        v-if="isTouchDevice"
        id="weight-input"
        type="button"
        :aria-label="`${inputValue} ${unitLabel}`"
        class="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-border bg-background text-xl font-bold tabular-nums transition-colors hover:border-primary/50 hover:bg-accent active:scale-[0.98]"
        @click="openModal"
      >
        <span>{{ inputValue }}</span>
        <span class="text-base font-normal text-muted-foreground">{{ unitLabel }}</span>
      </button>

      <!-- Desktop: Inline NumberField with +/- buttons -->
      <template v-else>
        <NumberField
          id="weight-input"
          v-model="inputValue"
          :min="0"
          :max="500"
          :step="0.5"
          class="flex-1"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput
              :placeholder="t('weight.placeholder')"
              class="text-center text-lg"
              @keyup.enter="handleSave"
            />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        <span class="text-muted-foreground">{{ unitLabel }}</span>
      </template>

      <Button
        :class="cn('shrink-0', isTouchDevice && 'h-12')"
        :disabled="!isValid"
        :aria-label="t('weight.saveWeight')"
        @click="handleSave"
      >
        {{ t('weight.save') }}
      </Button>
    </div>

    <NumericInputModal
      v-if="isTouchDevice"
      v-model="inputValue"
      v-model:open="modalOpen"
      type="weight"
      :unit="unitLabel"
    />
  </div>
</template>
