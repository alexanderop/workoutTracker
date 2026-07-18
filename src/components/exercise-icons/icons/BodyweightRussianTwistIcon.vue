<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="13" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M14 19l9 16-6 4-6-15z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m23 35 9-8 3 3-9 8zm11-6 5 4-2 3-6-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M15 20l14-3 1 4-14 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
