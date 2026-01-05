<script setup lang="ts">
import type { RoundFormState } from '../composables/useBenchmarkForm'

const { rounds, activeIndex } = defineProps<{
  rounds: ReadonlyArray<RoundFormState | { orderKey: string }>
  activeIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-2" role="tablist">
    <button
      v-for="(round, index) in rounds"
      :key="round.orderKey"
      role="tab"
      :aria-selected="activeIndex === index"
      :class="[
        'min-w-10 h-10 rounded-full font-medium transition-colors',
        activeIndex === index
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
      ]"
      @click="emit('select', index)"
    >
      {{ index + 1 }}
    </button>
  </div>
</template>
