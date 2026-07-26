<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path d="M18 20 21 23 6 16 7 12z" fill="var(--exercise-icon-body, currentColor)" />
    <circle cx="13" cy="26" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M18 22 32 26 31 32 17 28z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M22 28 21 32 30 35 32 31z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M30 25 33 28 43 26 42 22zM31 30 33 33 43 35 43 31z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M4 33c4-3 8 3 12 0s8 3 12 0 8 3 12 0v5c-4 3-8-3-12 0s-8-3-12 0-8 3-12 0z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
