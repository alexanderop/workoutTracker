<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="14" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M17 7 21 8 21 19 16 18zM31 7 27 8 27 19 32 18z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M18 18 30 18 28 30 26 40 22 40 20 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M6 4h36v3H6zM8 43h32v2H8z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
