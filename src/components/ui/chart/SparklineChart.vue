<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { VisLine, VisScatter, VisXYContainer } from '@unovis/vue'
import { cn } from '@/lib/utils'

/**
 * Minimal axis-less trend line for stat tiles (dashboard cards, summaries).
 * For an interactive chart with axes/tooltip/legend, compose VisXYContainer
 * directly with ChartContainer instead — see WeightChart.vue.
 */
const {
  data,
  color = 'var(--primary)',
  height = 48,
  strokeWidth = 2,
  showEndMarker = true,
  ariaLabel,
  class: className,
} = defineProps<{
  /** Values to plot, oldest first. */
  data: ReadonlyArray<number>
  /** Line and end-marker color — any CSS color, including `var(--token)`. */
  color?: string
  /** Chart height in pixels; width always fills the parent. */
  height?: number
  strokeWidth?: number
  /** Highlight the most recent value with a filled dot. */
  showEndMarker?: boolean
  ariaLabel?: string
  class?: HTMLAttributes['class']
}>()

type Point = { index: number; value: number }

const points = computed<Array<Point>>(() => data.map((value, index) => ({ index, value })))
const lastIndex = computed(() => data.length - 1)

function xAccessor(_d: Point, i: number): number {
  return i
}

function yAccessor(d: Point): number {
  return d.value
}

function endMarkerSize(_d: Point, i: number): number {
  return i === lastIndex.value ? 8 : 0
}
</script>

<template>
  <div
    v-if="data.length > 1"
    :class="
      cn('w-full [&_[data-vis-xy-container]]:h-full [&_[data-vis-xy-container]]:w-full', className)
    "
    :style="{ height: `${height}px` }"
    role="img"
    :aria-label="ariaLabel"
  >
    <VisXYContainer :data="points" :padding="{ top: 4, bottom: 4 }">
      <VisLine
        :x="xAccessor"
        :y="yAccessor"
        :color="color"
        curve-type="monotoneX"
        :line-width="strokeWidth"
      />
      <VisScatter
        v-if="showEndMarker"
        :x="xAccessor"
        :y="yAccessor"
        :color="color"
        :size="endMarkerSize"
      />
    </VisXYContainer>
  </div>
  <slot v-else name="empty" />
</template>
