<script setup lang="ts">
import type { Exercise } from '@/composables/useWorkout'
import { Plus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  exercises: Exercise[]
  selectedId: number
}

defineProps<Props>()
defineEmits<{
  select: [exerciseId: number]
  remove: [exerciseId: number]
  addExercise: []
}>()
</script>

<template>
  <div class="px-4 pb-4">
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Button
        v-for="exercise in exercises"
        :key="exercise.id"
        :variant="exercise.id === selectedId ? 'default' : 'secondary'"
        :class="cn(
          'flex-shrink-0 h-[72px] w-[72px] rounded-xl flex flex-col items-center justify-center relative touch-manipulation p-1',
          exercise.id === selectedId && 'ring-2 ring-primary',
        )"
        :title="exercise.name"
        @click="$emit('select', exercise.id)"
      >
        <span class="text-[28px] leading-none">{{ exercise.thumbnail }}</span>
        <span class="text-[10px] font-medium mt-1 text-center line-clamp-1 px-1">
          {{ exercise.name.split(' ')[0] }}
        </span>

        <!-- Remove button on hover -->
        <Button
          v-if="exercises.length > 1"
          variant="destructive"
          size="icon-sm"
          class="absolute -top-2 -right-2 opacity-0 hover:opacity-100 transition-opacity"
          @click.stop="$emit('remove', exercise.id)"
        >
          <X class="w-3 h-3" />
        </Button>
      </Button>

      <!-- Add Exercise Button -->
      <Button
        variant="outline"
        class="flex-shrink-0 h-[72px] w-[72px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center touch-manipulation p-0"
        @click="$emit('addExercise')"
      >
        <Plus class="w-5 h-5" />
      </Button>
    </div>
  </div>
</template>
