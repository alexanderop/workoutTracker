<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { MUSCLE_LABELS } from '@/lib/exerciseLabels'
import type { CustomExercise } from '@/types/exercises'

const { exercise, showBorder } = defineProps<{
  exercise: CustomExercise
  showBorder: boolean
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    class="w-full flex items-center gap-3 py-3 text-left transition-colors active:bg-muted/50 group"
    :class="showBorder ? 'border-b border-border/50' : ''"
    @click="emit('select')"
  >
    <span class="text-2xl flex-shrink-0 group-active:scale-110 transition-transform">
      {{ exercise.icon }}
    </span>
    <div class="min-w-0 flex-1">
      <p class="font-medium text-[15px] truncate">{{ exercise.name }}</p>
      <Badge v-if="exercise.muscle" variant="secondary" class="text-xs mt-0.5 font-normal">
        {{ MUSCLE_LABELS[exercise.muscle] }}
      </Badge>
    </div>
    <span
      class="text-muted-foreground/50 text-xl flex-shrink-0 group-active:translate-x-0.5 transition-transform"
    >
      ›
    </span>
  </button>
</template>
