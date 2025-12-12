<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

type Variant = 'stacked' | 'inline'

const { variant = 'stacked', class: className } = defineProps<{
  variant?: Variant
  class?: HTMLAttributes['class']
}>()

const containerClass = computed(() => {
  const base = 'flex gap-3'
  const variants: Record<Variant, string> = {
    stacked: 'flex-col sm:flex-row sm:justify-end',
    inline: 'flex-row',
  }
  return cn(base, variants[variant], className)
})

const buttonClass = computed(() => {
  const variants: Record<Variant, string> = {
    stacked: 'w-full sm:w-auto',
    inline: 'flex-1',
  }
  return variants[variant]
})

defineSlots<{
  default: (props: { buttonClass: string }) => unknown
}>()
</script>

<template>
  <div data-slot="dialog-actions" :class="containerClass">
    <slot :button-class="buttonClass" />
  </div>
</template>
