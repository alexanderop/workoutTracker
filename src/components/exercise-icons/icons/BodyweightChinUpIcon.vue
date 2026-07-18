<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path d="M6 4h36v3H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
    <circle cx="24" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m15 5 4 0 4 10-4 2zm18 0-4 0-4 10 4 2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M20 15h8l-1 12h-6z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 27h6l1 6-5 7-4-3 3-5z" fill="var(--exercise-icon-body, currentColor)" />
  </ExerciseIconSvg>
</template>
