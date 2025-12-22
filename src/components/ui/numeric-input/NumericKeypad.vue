<script setup lang="ts">
import { Delete } from 'lucide-vue-next'
import { useNumericInput } from './useNumericInput'

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

const buttonClass =
  'flex h-14 items-center justify-center rounded-lg bg-secondary text-xl font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 active:bg-secondary/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Digit Grid -->
    <div class="grid grid-cols-3 gap-2">
      <!-- Rows 1-3: digits 1-9 -->
      <template v-for="(row, rowIndex) in digits" :key="rowIndex">
        <button
          v-for="digit in row"
          :key="digit"
          type="button"
          :class="buttonClass"
          @click="handleDigitClick(digit)"
        >
          {{ digit }}
        </button>
      </template>

      <!-- Bottom row: empty, 0, backspace -->
      <div class="h-14" />

      <button
        type="button"
        :class="buttonClass"
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
