<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'

import { Badge } from '@/components/ui/badge'
import { MUSCLE_LABELS } from '@/lib/exerciseLabels'

const { exercise, variant = 'list' } = defineProps<{
  exercise: Exercise
  variant?: 'list' | 'dialog'
}>()

defineEmits<{
  select: [exercise: Exercise]
}>()
</script>

<template>
  <!-- Dialog variant: compact style with badge and chevron -->
  <button
    v-if="variant === 'dialog'"
    class="w-full flex items-center gap-3 py-3 text-left transition-colors active:bg-muted/50 group"
    @click="$emit('select', exercise)"
  >
    <span class="text-2xl flex-shrink-0 group-active:scale-110 transition-transform">
      {{ exercise.icon }}
    </span>
    <div class="min-w-0 flex-1">
      <p class="font-medium text-[15px] truncate">
        {{ exercise.name }}
      </p>
      <Badge v-if="exercise.muscle" variant="secondary" class="text-xs mt-0.5 font-normal">
        {{ MUSCLE_LABELS[exercise.muscle] }}
      </Badge>
    </div>
    <span class="text-muted-foreground/50 text-xl flex-shrink-0 group-active:translate-x-0.5 transition-transform">
      ›
    </span>
  </button>

  <!-- List variant: full-width style with icon container -->
  <button
    v-else
    class="w-full flex items-center gap-4 px-4 py-4 text-left rounded-xl transition-all duration-150 hover:bg-muted/50 active:bg-muted active:scale-[0.99] group"
    @click="$emit('select', exercise)"
  >
    <div
      class="flex-shrink-0 w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center text-2xl group-hover:bg-muted group-active:scale-95 transition-all duration-150"
    >
      {{ exercise.icon }}
    </div>
    <div class="min-w-0 flex-1">
      <p class="font-medium text-base tracking-tight truncate">
        {{ exercise.name }}
      </p>
      <p
        v-if="exercise.muscle"
        class="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide"
      >
        {{ MUSCLE_LABELS[exercise.muscle] }}
      </p>
    </div>
  </button>
</template>
