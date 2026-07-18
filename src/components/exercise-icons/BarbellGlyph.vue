<script setup lang="ts">
const {
  x = 4,
  y,
  width = 40,
  plateHeight = 11,
} = defineProps<{
  x?: number
  y: number
  width?: number
  plateHeight?: number
}>()
</script>

<template>
  <g fill="var(--exercise-icon-equipment, var(--primary))">
    <rect :x="x" :y="y - 1" :width="width" height="2" rx="1" />
    <rect :x="x + 1" :y="y - plateHeight / 2" width="4" :height="plateHeight" rx="1.5" />
    <rect :x="x + 5.5" :y="y - (plateHeight - 4) / 2" width="2" :height="plateHeight - 4" rx="1" />
    <rect :x="x + width - 5" :y="y - plateHeight / 2" width="4" :height="plateHeight" rx="1.5" />
    <rect
      :x="x + width - 7.5"
      :y="y - (plateHeight - 4) / 2"
      width="2"
      :height="plateHeight - 4"
      rx="1"
    />
  </g>
</template>
