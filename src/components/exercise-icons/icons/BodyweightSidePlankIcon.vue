<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="9" cy="14" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m11 17 31 17-2 4-30-17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m13 21 3 2-2 11h8v4H10l-1-4zM13 4h4v14h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 38h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
