<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="39" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m36 16-15 1-11 7 3 4 10-6 14 1 4-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m33 19-3 8 3 2 3-8zm5 1-4 8 3 2 4-8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M5 40h38v2H5z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
