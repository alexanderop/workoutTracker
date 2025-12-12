<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Minus, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

type Props = {
  min?: number
  max?: number
  step?: number
  largeStep?: number
  presets?: Array<number>
}

const {
  min = 1,
  max = 500,
  step = 1,
  largeStep = 5,
  presets = [5, 10, 15, 20, 25, 30, 40, 50],
} = defineProps<Props>()

const value = defineModel<number>({ required: true })

const { t } = useI18n()

const canDecrement = computed(() => value.value > min)
const canIncrement = computed(() => value.value < max)

function increment(amount: number) {
  const newValue = Math.min(max, value.value + amount)
  value.value = newValue
}

function decrement(amount: number) {
  const newValue = Math.max(min, value.value - amount)
  value.value = newValue
}

function selectPreset(preset: number) {
  value.value = preset
}

function handleSliderChange(sliderValue: Array<number> | undefined) {
  if (sliderValue?.[0] !== undefined) {
    value.value = sliderValue[0]
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Quick Select Grid -->
    <div>
      <p class="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {{ t('common.components.mobileNumberPicker.quickSelect') }}
      </p>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="preset in presets"
          :key="preset"
          type="button"
          :class="[
            'relative h-14 rounded-lg border-2 font-semibold transition-all',
            'active:scale-95',
            value === preset
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-background hover:border-primary/50 hover:bg-accent',
          ]"
          @click="selectPreset(preset)"
        >
          {{ preset }}
        </button>
      </div>
    </div>

    <!-- Slider -->
    <div>
      <p class="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {{ t('common.components.mobileNumberPicker.customValue') }}
      </p>
      <div class="space-y-4">
        <Slider
          :model-value="[value]"
          :min="min"
          :max="max"
          :step="step"
          class="touch-none"
          @update:model-value="handleSliderChange"
        />
      </div>
    </div>

    <!-- Stepper Controls -->
    <div>
      <p class="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {{ t('common.components.mobileNumberPicker.finetuneValue') }}
      </p>
      <div class="flex items-center gap-3">
        <!-- Large Decrement -->
        <Button
          type="button"
          variant="outline"
          size="icon"
          :disabled="!canDecrement"
          class="size-touch shrink-0"
          @click="decrement(largeStep)"
        >
          <Minus :size="20" stroke-width="3" />
        </Button>

        <!-- Small Decrement -->
        <Button
          type="button"
          variant="outline"
          size="icon"
          :disabled="!canDecrement"
          class="size-touch shrink-0"
          @click="decrement(step)"
        >
          <Minus :size="16" stroke-width="2.5" />
        </Button>

        <!-- Value Display -->
        <div
          class="flex h-16 flex-1 items-center justify-center rounded-lg border-2 border-primary/20 bg-accent/50"
        >
          <span class="text-4xl font-bold tabular-nums tracking-tight">
            {{ value }}
          </span>
        </div>

        <!-- Small Increment -->
        <Button
          type="button"
          variant="outline"
          size="icon"
          :disabled="!canIncrement"
          class="size-touch shrink-0"
          @click="increment(step)"
        >
          <Plus :size="16" stroke-width="2.5" />
        </Button>

        <!-- Large Increment -->
        <Button
          type="button"
          variant="outline"
          size="icon"
          :disabled="!canIncrement"
          class="size-touch shrink-0"
          @click="increment(largeStep)"
        >
          <Plus :size="20" stroke-width="3" />
        </Button>
      </div>
    </div>
  </div>
</template>
