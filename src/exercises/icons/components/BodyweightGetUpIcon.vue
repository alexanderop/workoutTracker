<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="30" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m27 19 5 2-5 12-4-2zM26 19l5 1-2-12h-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m31 23 8 15-4 2-7-14z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 31-16 6 1 4 16-5zM24 31l-10-5-2 4 10 5zM13 27l-4 13 4 1 4-12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
