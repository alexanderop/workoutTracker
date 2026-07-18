<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="26" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m23 12 6 1-2 14h-6zM23 13l-6 11 3 3 6-11zM22 27h6l2 15h-5l-2-10-2 10h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M18 26h2l2 9-1 6h-5l-1-6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
