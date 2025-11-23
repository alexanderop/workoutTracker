<script setup lang="ts">
import { type Muscle } from '@/stores/exercises'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  selected?: Muscle
}

interface Emits {
  'update:open': [value: boolean]
  select: [value: Muscle]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const muscleOptions: Array<{ value: Muscle; label: string; icon: string }> = [
  { value: 'chest', label: 'Chest', icon: '🏔️' },
  { value: 'back', label: 'Back', icon: '🔙' },
  { value: 'legs', label: 'Legs', icon: '🦵' },
  { value: 'shoulders', label: 'Shoulders', icon: '💪' },
  { value: 'arms', label: 'Arms', icon: '💯' },
  { value: 'core', label: 'Core', icon: '⭐' },
]

function handleSelect(muscle: Muscle) {
  emit('select', muscle)
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Select Muscle Group</DialogTitle>
        <DialogDescription>
          Choose the primary muscle group targeted
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <button
          v-for="option in muscleOptions"
          :key="option.value"
          @click="handleSelect(option.value)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left',
            selected === option.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900',
          ]"
        >
          <span class="text-2xl">{{ option.icon }}</span>
          <span class="font-medium">{{ option.label }}</span>
          <span v-if="selected === option.value" class="ml-auto text-primary">✓</span>
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
