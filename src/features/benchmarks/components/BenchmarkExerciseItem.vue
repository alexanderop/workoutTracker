<script setup lang="ts">
import { GripVertical, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ExerciseAvatar from '@/exercises/ui/ExerciseAvatar.vue'
import type { BenchmarkFormExercise } from '../composables/useBenchmarkForm'
import { useI18n } from 'vue-i18n'

type Emits = {
  remove: []
  click: []
}

const { exercise, index } = defineProps<{
  exercise: BenchmarkFormExercise
  index: number
}>()

const emit = defineEmits<Emits>()

function handleClick(event: Event) {
  // Don't emit click if clicking on delete button
  const target = event.target
  if (target instanceof HTMLElement && target.closest('button')) return
  emit('click')
}
const { t } = useI18n()
</script>

<template>
  <div
    data-testid="benchmark-exercise-item"
    class="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="emit('click')"
  >
    <!-- Drag handle -->
    <div
      :data-testid="`exercise-drag-handle-${index}`"
      class="drag-handle flex-shrink-0 cursor-grab active:cursor-grabbing"
    >
      <GripVertical class="icon-md text-muted-foreground" aria-hidden="true" />
    </div>

    <!-- Order number -->
    <div
      class="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold"
    >
      {{ index + 1 }}
    </div>

    <!-- Exercise icon -->
    <ExerciseAvatar :name="exercise.name" :image="exercise.image" size="md" />

    <!-- Exercise info -->
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{{ exercise.name }}</p>
      <p class="text-sm text-muted-foreground">
        {{ exercise.prescribedReps }} {{ t('common.reps') }}
      </p>
    </div>

    <!-- Delete button -->
    <Button
      variant="ghost"
      size="icon-sm"
      class="flex-shrink-0 text-muted-foreground hover:text-destructive"
      :aria-label="t('common.aria.removeExercise')"
      @click="emit('remove')"
    >
      <X class="icon-sm" aria-hidden="true" />
    </Button>
  </div>
</template>
