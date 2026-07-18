<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="35" cy="28" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m31 31-12 2-14 3 1 4 13-2 13-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m31 32 11-9 2 3-11 9zm-1 2 12-6 1 3-12 6z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
