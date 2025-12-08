<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import type { BenchmarkFormExercise } from '../composables/useBenchmarkForm'
import BenchmarkExerciseItem from './BenchmarkExerciseItem.vue'

type Emits = {
  remove: [index: number]
  reorder: [fromIndex: number, toIndex: number]
}

const { exercises } = defineProps<{
  exercises: ReadonlyArray<BenchmarkFormExercise>
}>()

const emit = defineEmits<Emits>()

const sortableContainer = useTemplateRef<HTMLElement>('sortableContainer')
const exercisesList = ref([...exercises])

watch(
  () => exercises,
  (newExercises) => {
    exercisesList.value = [...newExercises]
  },
)

useSortable(sortableContainer, exercisesList, {
  animation: 150,
  ghostClass: 'opacity-50',
  handle: '.drag-handle',
  onEnd: (event) => {
    const { oldIndex, newIndex } = event
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      emit('reorder', oldIndex, newIndex)
    }
  },
})
</script>

<template>
  <div ref="sortableContainer" class="space-y-2">
    <BenchmarkExerciseItem
      v-for="(exercise, index) in exercisesList"
      :key="`${exercise.exerciseDefinitionId}-${index}`"
      :exercise="exercise"
      :index="index"
      @remove="emit('remove', index)"
    />
  </div>
</template>
