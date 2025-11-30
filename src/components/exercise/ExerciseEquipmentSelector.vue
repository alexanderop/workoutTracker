<script setup lang="ts">
import type { Equipment } from '@/stores/exercises'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Props = {
  open: boolean
  selected?: Equipment
}

type Emits = {
  'update:open': [value: boolean]
  select: [value: Equipment]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const equipmentOptions: Array<{ value: Equipment; label: string; icon: string }> = [
  { value: 'barbell', label: 'Barbell', icon: '🏋️' },
  { value: 'dumbbell', label: 'Dumbbell', icon: '🪑' },
  { value: 'machine', label: 'Machine', icon: '⚙️' },
  { value: 'cable', label: 'Cable', icon: '📏' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { value: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
  { value: 'band', label: 'Band', icon: '〰️' },
  { value: 'ez-bar', label: 'EZ Bar', icon: '↪️' },
  { value: 'hex-bar', label: 'Hex Bar', icon: '⬡' },
]

function handleSelect(equipment: Equipment) {
  emit('select', equipment)
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
    <MobileDialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Select Equipment</DialogTitle>
        <DialogDescription> Choose the primary equipment for this exercise </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="option in equipmentOptions"
          :key="option.value"
          class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all"
          :class="[
            selected === option.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900',
          ]"
          @click="handleSelect(option.value)"
        >
          <span class="text-3xl">{{ option.icon }}</span>
          <span class="text-xs font-medium text-center">{{ option.label }}</span>
        </button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
