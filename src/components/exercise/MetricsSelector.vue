<script setup lang="ts">
import { type Metrics } from '@/stores/exercises'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  selected?: Metrics
}

interface Emits {
  'update:open': [value: boolean]
  select: [value: Metrics]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const metricsOptions: Array<{ value: Metrics; label: string; description: string }> = [
  { value: 'weight-reps', label: 'Weight + Reps', description: 'Standard lifting (e.g., 5kg x 10 reps)' },
  { value: 'reps-only', label: 'Reps Only', description: 'Bodyweight volume (e.g., 10 reps)' },
  { value: 'duration', label: 'Duration', description: 'Time-based (e.g., Planks for 60 seconds)' },
  { value: 'distance-duration', label: 'Distance + Duration', description: 'Cardio (e.g., 5km in 30 mins)' },
  { value: 'weight-distance', label: 'Weight + Distance', description: 'Combined (e.g., Sled Push 100m)' },
]

function handleSelect(metrics: Metrics) {
  emit('select', metrics)
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Select Tracking Method</DialogTitle>
        <DialogDescription>
          Choose what data will be tracked when performing this exercise
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <button
          v-for="option in metricsOptions"
          :key="option.value"
          @click="handleSelect(option.value)"
          :class="[
            'w-full text-left px-4 py-3 rounded-lg border transition-all',
            selected === option.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900',
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium">{{ option.label }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ option.description }}</p>
            </div>
            <span v-if="selected === option.value" class="text-primary text-lg flex-shrink-0">✓</span>
          </div>
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
