<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="16" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m11 13-4 15 5 3v12h5V29l5-5-2-11zM12 43H5l5-15 4 3zm5 0h8l-5-19-4 5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m10 15 3-2 3 8 8-2 1 3-11 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M41 5h2v36h-2zM39 33h5v5h-5zM21 19h6v2h-6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="m26 19 15 15-2 2-15-15z" fill="var(--exercise-icon-equipment, var(--primary))" />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
