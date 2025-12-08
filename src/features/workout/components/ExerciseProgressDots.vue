<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  totalExercises: number
  currentIndex: number // 0-based
}

const { totalExercises, currentIndex } = defineProps<Props>()

const dots = computed(() => {
  return Array.from({ length: totalExercises }, (_, i) => {
    if (i < currentIndex) return 'completed'
    if (i === currentIndex) return 'active'
    return 'upcoming'
  })
})
</script>

<template>
  <div class="flex items-center justify-center gap-2 px-4 py-3">
    <div
      v-for="(state, i) in dots"
      :key="i"
      class="transition-all duration-200"
      :class="{
        'h-2 w-2 rounded-full bg-primary': state === 'active',
        'h-1.5 w-1.5 rounded-full bg-primary/60': state === 'completed',
        'h-1.5 w-1.5 rounded-full bg-muted-foreground/20': state === 'upcoming',
      }"
      :aria-label="`Exercise ${i + 1} of ${totalExercises}, ${state}`"
    />
  </div>
</template>
