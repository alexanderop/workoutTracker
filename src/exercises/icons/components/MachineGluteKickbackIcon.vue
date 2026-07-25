<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="12" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m11 15 5 2 5 10-5 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m11 16-4 6 3 3 4-6z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m15 27 5 1-3 12h-5zM19 27l15-8 2 4-15 8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M5 14h3v26H5zM36 16l5 2-2 5-5-2z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
