<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { BlockExercise } from '@/types/blocks'
import { getEquipmentIcon } from '@/lib/equipmentIcons'

const { t } = useI18n()

/**
 * Shared exercise list component for timed block configuration dialogs.
 *
 * Displays a list of exercises with reps/load inputs and add/remove actions.
 * Used by AMRAP, EMOM, and ForTime config dialogs.
 */
type Props = {
  exercises: ReadonlyArray<BlockExercise>
  repPlaceholder?: string
  loadPlaceholder?: string
  emptyMessage?: string
  addButtonText?: string
}

type Emits = {
  'update:reps': [index: number, reps: number]
  'update:load': [index: number, load: string]
  remove: [index: number]
  add: []
}

const {
  exercises,
  repPlaceholder = 'Reps',
  loadPlaceholder = 'Load',
  emptyMessage = 'No exercises added yet',
  addButtonText = 'Add Exercise',
} = defineProps<Props>()

const emit = defineEmits<Emits>()

function handleRepsChange(index: number, value: string | number) {
  emit('update:reps', index, Number(value))
}

function handleLoadChange(index: number, value: string | number) {
  emit('update:load', index, String(value))
}

function handleRemove(index: number) {
  emit('remove', index)
}

function handleAdd() {
  emit('add')
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="exercises.length === 0" class="text-center py-6 text-muted-foreground">
      {{ emptyMessage }}
    </p>

    <div
      v-for="(exercise, index) in exercises"
      :key="exercise.id"
      class="flex items-center gap-3 bg-secondary/30 rounded-lg p-3"
    >
      <component :is="getEquipmentIcon(exercise.equipment)" class="size-5" />
      <div class="flex-1 min-w-0">
        <p class="font-medium truncate">{{ exercise.name }}</p>
        <div class="flex gap-2 mt-1">
          <Input
            :model-value="exercise.prescribedReps"
            type="number"
            min="1"
            class="h-8 w-20"
            :placeholder="repPlaceholder"
            @update:model-value="handleRepsChange(index, $event)"
          />
          <Input
            :model-value="exercise.load ?? ''"
            class="h-8 flex-1"
            :placeholder="loadPlaceholder"
            @update:model-value="handleLoadChange(index, $event)"
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-destructive"
        :aria-label="t('common.aria.removeExercise')"
        @click="handleRemove(index)"
      >
        <Trash2 class="w-4 h-4" />
      </Button>
    </div>

    <Button variant="outline" class="w-full" @click="handleAdd">
      <Plus class="w-4 h-4 mr-2" />
      {{ addButtonText }}
    </Button>
  </div>
</template>
