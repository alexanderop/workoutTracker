<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Delete } from 'lucide-vue-next'
import { useNumericInput } from './useNumericInput'
import { useNumberLocale } from '@/composables/useNumberLocale'

type Props = {
  max?: number
  allowDecimal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 999,
  allowDecimal: false,
})

const modelValue = defineModel<number>({ required: true })

const {
  stringToNumber,
  numberToString,
  appendDigitToString,
  appendDecimalToString,
  removeLastChar,
} = useNumericInput()

const { decimalSeparator } = useNumberLocale()

// Internal string representation for precise decimal editing
const editingString = ref(numberToString(modelValue.value))

// Fresh start mode: first digit replaces value instead of appending (calculator-style)
const freshStart = ref(true)

// Screen reader announcement for input mode
const inputModeAnnouncement = computed(() =>
  freshStart.value ? 'Replace mode: next digit will replace current value' : '',
)

// Sync editingString when modelValue changes externally
watch(
  () => modelValue.value,
  (newValue) => {
    const currentNumber = stringToNumber(editingString.value)
    if (currentNumber !== newValue) {
      editingString.value = numberToString(newValue)
      freshStart.value = true // Reset fresh start when value changes externally
    }
  },
)

const digits = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

function handleDigitClick(digit: string) {
  if (freshStart.value) {
    // First digit replaces entire value (calculator-style)
    editingString.value = digit
    freshStart.value = false
    modelValue.value = stringToNumber(editingString.value)
    return
  }
  editingString.value = appendDigitToString(editingString.value, digit, {
    max: props.max,
    maxDecimals: 2,
  })
  modelValue.value = stringToNumber(editingString.value)
}

function handleDecimalClick() {
  if (freshStart.value) {
    // Start fresh with "0."
    editingString.value = '0.'
    freshStart.value = false
    return
  }
  editingString.value = appendDecimalToString(editingString.value)
  // Don't update modelValue yet - "70." should stay as 70 until more digits added
}

function handleBackspace() {
  // Backspace exits fresh-start mode (user wants to edit existing value)
  freshStart.value = false
  editingString.value = removeLastChar(editingString.value)
  modelValue.value = stringToNumber(editingString.value)
}

const buttonClass =
  'flex h-14 items-center justify-center rounded-lg bg-secondary text-xl font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 active:bg-secondary/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
</script>

<template>
  <div class="flex flex-col gap-2" role="group" aria-label="Numeric keypad">
    <!-- Screen reader announcement for input mode -->
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ inputModeAnnouncement }}
    </div>

    <!-- Digit Grid -->
    <div class="grid grid-cols-3 gap-2">
      <!-- Rows 1-3: digits 1-9 -->
      <template v-for="(row, rowIndex) in digits" :key="rowIndex">
        <button
          v-for="digit in row"
          :key="digit"
          type="button"
          :class="buttonClass"
          :aria-label="String(digit)"
          @click="handleDigitClick(digit)"
        >
          {{ digit }}
        </button>
      </template>

      <!-- Bottom row: decimal (or empty), 0, backspace -->
      <button
        v-if="allowDecimal"
        type="button"
        :class="buttonClass"
        aria-label="Add decimal point"
        @click="handleDecimalClick"
      >
        {{ decimalSeparator }}
      </button>
      <div v-else class="h-14" />

      <button
        type="button"
        :class="buttonClass"
        aria-label="0"
        @click="handleDigitClick('0')"
      >
        0
      </button>

      <button
        type="button"
        :class="buttonClass"
        aria-label="Backspace"
        @click="handleBackspace"
      >
        <Delete class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>
