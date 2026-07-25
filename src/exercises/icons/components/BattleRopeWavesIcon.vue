<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="12" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m11 14 5 1 3 12-6 1zM13 27l9 4-3 9h-5l3-7-8-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m15 15 8 5-2 4-8-5z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 19l6 5 5-4 6 6 5-3v3l-5 3-6-6-5 4-6-5zM20 25l6-4 5 5 6-4 5 5v3l-5-5-6 4-5-5-6 4zM40 22h4v18h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
