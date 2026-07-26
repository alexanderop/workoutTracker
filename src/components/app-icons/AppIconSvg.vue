<script setup lang="ts">
import type { SVGAttributes } from 'vue'
import { cn } from '@/lib/utils'

const { class: className } = defineProps<{
  class?: SVGAttributes['class']
}>()

defineSlots<{
  default(): unknown
}>()
</script>

<template>
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="cn('size-full shrink-0 text-foreground', className)"
  >
    <slot />
  </svg>
</template>
