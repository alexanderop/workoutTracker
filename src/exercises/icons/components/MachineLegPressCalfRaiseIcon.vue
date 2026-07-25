<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M4 39h18v3H4zm2-19 3-3 8 11-4 3z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="11" cy="14" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m13 17 9 9-5 6-7-7z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 27 15-12 3 4-15 11zm-1 3 14-9 2 3-14 10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m40 6 4 3-6 12-4-3z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
