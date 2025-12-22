<script setup lang="ts">
import { Delete } from 'lucide-vue-next'
import { useNumericInput } from './useNumericInput'
import { Button } from '@/components/ui/button'

type Props = {
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  max: 999,
})

const modelValue = defineModel<number>({ required: true })

const { appendDigit, removeDigit } = useNumericInput()

const digits = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

function handleDigitClick(digit: string) {
  modelValue.value = appendDigit(modelValue.value, digit, { max: props.max })
}

function handleBackspace() {
  modelValue.value = removeDigit(modelValue.value)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Value Display -->
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="keypad-display"
      class="flex h-14 items-center justify-center rounded-lg bg-secondary/30"
    >
      <span class="text-3xl font-bold tabular-nums text-primary">
        {{ modelValue }}
      </span>
    </div>

    <!-- Digit Grid -->
    <div class="grid grid-cols-3 gap-2">
      <!-- Rows 1-3: digits 1-9 -->
      <template v-for="(row, rowIndex) in digits" :key="rowIndex">
        <Button
          v-for="digit in row"
          :key="digit"
          type="button"
          variant="secondary"
          class="h-14 text-xl font-semibold"
          @click="handleDigitClick(digit)"
        >
          {{ digit }}
        </Button>
      </template>

      <!-- Bottom row: empty, 0, backspace -->
      <div class="h-14" />

      <Button
        type="button"
        variant="secondary"
        class="h-14 text-xl font-semibold"
        @click="handleDigitClick('0')"
      >
        0
      </Button>

      <Button
        type="button"
        variant="secondary"
        class="h-14"
        aria-label="Backspace"
        @click="handleBackspace"
      >
        <Delete class="h-6 w-6" />
      </Button>
    </div>
  </div>
</template>
