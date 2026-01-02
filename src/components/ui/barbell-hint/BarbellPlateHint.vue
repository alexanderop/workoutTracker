<script setup lang="ts">
import { computed } from 'vue'
import { calculatePlates, getBarWeight } from '@/lib/plateCalculation'
import type { WeightUnit } from '@/types/settings'

type Props = {
  weight: number
  unit: WeightUnit
}

type PlateStyle = { bg: string; text: string }
type PlateColorConfig = Record<number, PlateStyle>
type PlateHeightConfig = Record<number, string>

const props = defineProps<Props>()

const plateResult = computed(() => calculatePlates(props.weight, props.unit))
const barWeight = computed(() => getBarWeight(props.unit))

// Reverse plates for visual display (closest to bar first)
const displayPlates = computed(() => [...plateResult.value.plates].reverse())

// Olympic color scheme for plates
const PLATE_COLORS: Record<WeightUnit, PlateColorConfig> = {
  kg: {
    25: { bg: 'bg-red-500', text: 'text-white' },
    20: { bg: 'bg-blue-500', text: 'text-white' },
    15: { bg: 'bg-yellow-400', text: 'text-gray-900' },
    10: { bg: 'bg-green-500', text: 'text-white' },
    5: { bg: 'bg-white border border-gray-300', text: 'text-gray-900' },
    2.5: { bg: 'bg-red-300', text: 'text-gray-900' },
    1.25: { bg: 'bg-gray-400', text: 'text-white' },
  },
  lbs: {
    45: { bg: 'bg-blue-500', text: 'text-white' },
    35: { bg: 'bg-yellow-400', text: 'text-gray-900' },
    25: { bg: 'bg-green-500', text: 'text-white' },
    10: { bg: 'bg-white border border-gray-300', text: 'text-gray-900' },
    5: { bg: 'bg-red-300', text: 'text-gray-900' },
    2.5: { bg: 'bg-gray-400', text: 'text-white' },
  },
}

// Plate heights based on weight (visual scaling)
const PLATE_HEIGHTS: Record<WeightUnit, PlateHeightConfig> = {
  kg: {
    25: 'h-10',
    20: 'h-9',
    15: 'h-8',
    10: 'h-7',
    5: 'h-6',
    2.5: 'h-5',
    1.25: 'h-4',
  },
  lbs: {
    45: 'h-10',
    35: 'h-9',
    25: 'h-8',
    10: 'h-7',
    5: 'h-6',
    2.5: 'h-5',
  },
}

const DEFAULT_STYLE: PlateStyle = { bg: 'bg-gray-500', text: 'text-white' }
const DEFAULT_HEIGHT = 'h-6'

function getPlateColor(plate: number): PlateStyle {
  const colors = PLATE_COLORS[props.unit]
  return colors[plate] ?? DEFAULT_STYLE
}

function getPlateHeight(plate: number): string {
  const heights = PLATE_HEIGHTS[props.unit]
  return heights[plate] ?? DEFAULT_HEIGHT
}

// Generate accessible description of plates
const ariaLabel = computed(() => {
  if (displayPlates.value.length === 0) {
    return `Empty barbell, ${barWeight.value}${props.unit} bar`
  }
  const plateDesc = plateResult.value.plates
    .map((p) => `${p}${props.unit}`)
    .join(', ')
  return `Barbell with ${plateDesc} plates on each side`
})
</script>

<template>
  <div
    class="flex items-center"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- Bar end (sleeve) -->
    <div class="h-3 w-6 rounded-l-sm bg-gray-400" />

    <!-- Plates (rendered closest to bar first) -->
    <div class="flex items-center">
      <div
        v-for="(plate, index) in displayPlates"
        :key="index"
        :class="[
          getPlateColor(plate).bg,
          getPlateColor(plate).text,
          getPlateHeight(plate),
          'w-2.5 rounded-sm flex items-center justify-center text-[7px] font-bold',
        ]"
      >
        <span v-if="plate >= 10" class="-rotate-90" aria-hidden="true">{{ plate }}</span>
      </div>
    </div>

    <!-- Bar weight indicator (when empty or few plates) -->
    <div
      v-if="displayPlates.length === 0"
      class="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-gray-700"
    >
      {{ barWeight }}
    </div>
  </div>
</template>
