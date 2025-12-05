<script setup lang="ts">
import TemplateExerciseItem from './TemplateExerciseItem.vue'

export type TemplateExercise = {
  exerciseId: string
  name: string
  equipment: string
  thumbnail: string
  defaultSetCount: number
}

type Props = {
  exercises: ReadonlyArray<TemplateExercise>
}

type Emits = {
  'update:exercises': [exercises: ReadonlyArray<TemplateExercise>]
  'remove-exercise': [exerciseId: string]
}

const { exercises } = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleSetCountChange(exerciseId: string, count: number): void {
  const updated: Array<TemplateExercise> = exercises.map((ex) =>
    ex.exerciseId === exerciseId ? { ...ex, defaultSetCount: count } : ex,
  )
  emit('update:exercises', updated)
}

function handleRemove(exerciseId: string): void {
  emit('remove-exercise', exerciseId)
}

function handleMoveUp(exerciseId: string): void {
  const index = exercises.findIndex((ex) => ex.exerciseId === exerciseId)
  if (index <= 0) return

  const updated: Array<TemplateExercise> = [...exercises]
  const temp = updated[index - 1]
  if (temp && updated[index]) {
    updated[index - 1] = updated[index]
    updated[index] = temp
    emit('update:exercises', updated)
  }
}

function handleMoveDown(exerciseId: string): void {
  const index = exercises.findIndex((ex) => ex.exerciseId === exerciseId)
  if (index < 0 || index >= exercises.length - 1) return

  const updated: Array<TemplateExercise> = [...exercises]
  const temp = updated[index]
  if (temp) {
    updated[index] = updated[index + 1]!
    updated[index + 1] = temp
    emit('update:exercises', updated)
  }
}
</script>

<template>
  <div class="space-y-2">
    <TemplateExerciseItem
      v-for="(exercise, index) in exercises"
      :key="exercise.exerciseId"
      :exercise="exercise"
      :movement="{ canMoveUp: index > 0, canMoveDown: index < exercises.length - 1 }"
      @update:set-count="(count) => handleSetCountChange(exercise.exerciseId, count)"
      @remove="() => handleRemove(exercise.exerciseId)"
      @move-up="() => handleMoveUp(exercise.exerciseId)"
      @move-down="() => handleMoveDown(exercise.exerciseId)"
    />
  </div>
</template>
