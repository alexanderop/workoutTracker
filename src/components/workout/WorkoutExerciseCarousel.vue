<script setup lang="ts">
import type { Exercise } from '@/composables/useWorkout'
import { Plus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useTemplateRef, ref, watch } from 'vue'

type Props = {
  exercises: ReadonlyArray<Exercise>
  selectedId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [exerciseId: number]
  remove: [exerciseId: number]
  reorder: [fromIndex: number, toIndex: number]
  'add-exercise': []
}>()

const sortableContainer = useTemplateRef<HTMLElement>('sortableContainer')

// Create a mutable shallow copy for sortable to work with
// Must use ref (not computed) because useSortable writes to the array during drag operations
const exercisesList = ref([...props.exercises])

watch(
  () => props.exercises,
  (newExercises) => {
    exercisesList.value = [...newExercises]
  },
)

useSortable(sortableContainer, exercisesList, {
  animation: 150,
  ghostClass: 'opacity-50',
  onEnd: (event) => {
    const { oldIndex, newIndex } = event
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      emit('reorder', oldIndex, newIndex)
    }
  },
})
</script>

<template>
  <div class="px-4 pt-4 pb-2">
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <div ref="sortableContainer" class="flex gap-2">
        <div v-for="exercise in exercisesList" :key="exercise.id" class="relative flex-shrink-0">
          <Button
            :variant="exercise.id === selectedId ? 'default' : 'secondary'"
            :aria-pressed="exercise.id === selectedId"
            :class="
              cn(
                'h-[72px] w-[72px] rounded-xl flex flex-col items-center justify-center relative touch-manipulation p-1',
                exercise.id === selectedId && 'ring-2 ring-primary',
              )
            "
            :title="exercise.name"
            @click="emit('select', exercise.id)"
          >
            <span class="text-[28px] leading-none">{{ exercise.thumbnail }}</span>
            <span class="text-[10px] font-medium mt-1 text-center line-clamp-1 px-1">
              {{ exercise.name.split(' ')[0] }}
            </span>
          </Button>

          <!-- Remove button - hover only -->
          <Button
            v-if="exercisesList.length > 1"
            variant="destructive"
            size="icon-sm"
            class="absolute -top-2 -right-2 opacity-0 hover:opacity-100 transition-opacity"
            @click.stop="emit('remove', exercise.id)"
          >
            <X class="w-3 h-3" />
          </Button>
        </div>
      </div>

      <!-- Add Exercise Button -->
      <Button
        variant="outline"
        aria-label="Add exercise"
        class="flex-shrink-0 h-[72px] w-[72px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center touch-manipulation p-0"
        @click="emit('add-exercise')"
      >
        <Plus class="w-5 h-5" />
      </Button>
    </div>
  </div>
</template>
