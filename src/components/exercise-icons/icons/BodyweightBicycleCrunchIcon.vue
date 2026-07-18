<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="10" cy="26" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m11 28 5-3 9 9-4 4z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m12 25 8 2-1 4-8-2z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 34-8-7 5-6 3 2-4 5 6 4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m24 33 16-5 1 4-16 5z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
