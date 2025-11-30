<script setup lang="ts">
import type { ExerciseType } from '@/stores/exercises'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Props = {
  open: boolean
  selected?: ExerciseType
}

type Emits = {
  'update:open': [value: boolean]
  select: [value: ExerciseType]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const typeOptions: Array<{ value: ExerciseType; label: string; description: string }> = [
  {
    value: 'compound',
    label: 'Compound Movement',
    description: 'Complex, multi-joint lifts like Squats/Bench',
  },
  {
    value: 'isolation',
    label: 'Isolation Movement',
    description: 'Single-joint lifts like Curls/Extensions',
  },
  { value: 'stability', label: 'Stability/Core', description: 'Planks, static holds' },
  { value: 'cardio', label: 'Cardio', description: 'Running, Jumping Jacks' },
]

function handleSelect(type: ExerciseType) {
  emit('select', type)
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
    <MobileDialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Select Exercise Type</DialogTitle>
        <DialogDescription> Choose the complexity or category of this exercise </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          class="w-full text-left px-4 py-3 rounded-lg border transition-all"
          :class="[
            selected === option.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900',
          ]"
          @click="handleSelect(option.value)"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium">
                {{ option.label }}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ option.description }}
              </p>
            </div>
            <span v-if="selected === option.value" class="text-primary text-lg flex-shrink-0"
              >✓</span
            >
          </div>
        </button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
