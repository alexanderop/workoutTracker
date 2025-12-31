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
  <div class="space-y-3">
    <Label for="weight-input">{{ t('weight.enterWeight') }}</Label>

    <!-- Mobile: Tap to open fullscreen modal -->
    <template v-if="isTouchDevice">
      <button
        type="button"
        class="flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-border bg-background text-2xl font-bold tabular-nums transition-colors hover:border-primary/50 hover:bg-accent active:scale-[0.98]"
        @click="openModal"
      >
        <span>{{ inputValue }}</span>
        <span class="text-lg font-normal text-muted-foreground">{{ unitLabel }}</span>
      </button>

      <NumericInputModal
        v-model="inputValue"
        v-model:open="modalOpen"
        type="weight"
        :unit="unitLabel"
      />
    </template>

    <!-- Desktop: Inline NumberField with +/- buttons -->
    <template v-else>
      <div class="flex items-center gap-2">
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
      </div>
    </template>

    <Button class="w-full" :disabled="!isValid" @click="handleSave">
      {{ t('weight.save') }}
    </Button>
  </div>
</template>
