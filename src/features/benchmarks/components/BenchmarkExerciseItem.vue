<script setup lang="ts">
import { GripVertical, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { BenchmarkFormExercise } from '../composables/useBenchmarkForm'
import { useI18n } from 'vue-i18n'

type Emits = {
  remove: []
}

const { exercise, index } = defineProps<{
  exercise: BenchmarkFormExercise
  index: number
}>()

const emit = defineEmits<Emits>()
const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
    <!-- Drag handle -->
    <div class="drag-handle flex-shrink-0 cursor-grab active:cursor-grabbing">
      <GripVertical class="size-5 text-muted-foreground" />
    </div>

    <!-- Order number -->
    <div
      class="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold"
    >
      {{ index + 1 }}
    </div>

    <!-- Exercise icon -->
    <div class="flex-shrink-0 text-2xl">
      {{ exercise.thumbnail }}
    </div>

    <!-- Exercise info -->
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{{ exercise.name }}</p>
      <p class="text-sm text-muted-foreground">{{ exercise.prescribedReps }} {{ t('common.reps') }}</p>
    </div>

    <!-- Delete button -->
    <Button
      variant="ghost"
      size="icon-sm"
      class="flex-shrink-0 text-muted-foreground hover:text-destructive"
      @click="emit('remove')"
    >
      <X class="size-4" />
    </Button>
  </div>
</template>
