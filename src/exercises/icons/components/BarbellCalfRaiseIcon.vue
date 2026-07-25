<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
import BarbellGlyph from '@/exercises/icons/BarbellGlyph.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 12-1 15h10l-2-15zM20 27l-1 11 4 4h3l-4-5 2-10zm6 0 1 10 4 5h3l-4-6-1-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M13 12l8 1 1 4-9-1zm22 0-8 1-1 4 9-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <BarbellGlyph :y="12.5" :plate-height="10" />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
