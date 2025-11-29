<script setup lang="ts">
import type { Set } from '@/composables/useWorkout'
import { computed } from 'vue'
import { Separator } from '@/components/ui/separator'

interface Props {
  sets: ReadonlyArray<Set>
  date?: string
}

const props = defineProps<Props>()

const hasHistoryData = computed(
  () => props.sets.length > 0 && props.sets.some(set => set.kg !== '' || set.reps !== ''),
)
</script>

<template>
  <div v-if="hasHistoryData" class="mt-2">
    <Separator class="my-6" />
    <p class="text-xs font-semibold text-muted-foreground mb-3">
      PREVIOUS ({{ date }})
    </p>
    <div class="space-y-1">
      <div v-for="(set, index) in sets.slice(0, 3)" :key="set.id" class="flex justify-between text-sm px-2 py-1 bg-secondary/30 rounded">
        <span class="text-muted-foreground">Set {{ index + 1 }}</span>
        <span class="font-medium">{{ set.kg }} kg × {{ set.reps }}</span>
      </div>
    </div>
  </div>
</template>
