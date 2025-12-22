<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useNumericInput } from './useNumericInput'

type Props = {
  min?: number
  max?: number
  smallStep?: number
  largeStep?: number
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 999,
  smallStep: 1,
  largeStep: 5,
})

const modelValue = defineModel<number>({ required: true })

const { clampValue } = useNumericInput()

const canDecrement = computed(() => modelValue.value > props.min)
const canIncrement = computed(() => modelValue.value < props.max)

function increment(amount: number) {
  const newValue = clampValue(modelValue.value + amount, {
    min: props.min,
    max: props.max,
  })
  modelValue.value = newValue
}

function decrement(amount: number) {
  const newValue = clampValue(modelValue.value - amount, {
    min: props.min,
    max: props.max,
  })
  modelValue.value = newValue
}

function formatStep(step: number): string {
  return step % 1 === 0 ? String(step) : step.toFixed(1)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Large Decrement -->
    <Button
      type="button"
      variant="secondary"
      size="icon"
      :disabled="!canDecrement"
      :aria-label="`Decrement by ${formatStep(largeStep)}`"
      class="h-12 w-12 shrink-0"
      @click="decrement(largeStep)"
    >
      <Minus :size="24" stroke-width="3" aria-hidden="true" />
    </Button>

    <!-- Small Decrement -->
    <Button
      type="button"
      variant="secondary"
      size="icon"
      :disabled="!canDecrement"
      :aria-label="`Decrement by ${formatStep(smallStep)}`"
      class="h-12 w-12 shrink-0"
      @click="decrement(smallStep)"
    >
      <Minus :size="18" stroke-width="2.5" aria-hidden="true" />
    </Button>

    <!-- Value Display -->
    <div
      data-testid="stepper-display"
      class="flex h-14 flex-1 items-center justify-center rounded-lg border-2 border-primary/20 bg-secondary/30"
    >
      <span class="text-3xl font-bold tabular-nums tracking-tight">
        {{ modelValue }}
      </span>
    </div>

    <!-- Small Increment -->
    <Button
      type="button"
      variant="secondary"
      size="icon"
      :disabled="!canIncrement"
      :aria-label="`Increment by ${formatStep(smallStep)}`"
      class="h-12 w-12 shrink-0"
      @click="increment(smallStep)"
    >
      <Plus :size="18" stroke-width="2.5" aria-hidden="true" />
    </Button>

    <!-- Large Increment -->
    <Button
      type="button"
      variant="secondary"
      size="icon"
      :disabled="!canIncrement"
      :aria-label="`Increment by ${formatStep(largeStep)}`"
      class="h-12 w-12 shrink-0"
      @click="increment(largeStep)"
    >
      <Plus :size="24" stroke-width="3" aria-hidden="true" />
    </Button>
  </div>
</template>
