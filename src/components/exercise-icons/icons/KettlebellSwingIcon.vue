<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="16" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m15 15-3 13 7 3 3-8 8 6 3-4-12-11zM14 27l7 4-5 12h-6l6-11-7-2zm7 4 7-4 10 14h-6l-7-8-6 10h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m20 17 14 5-1 4-15-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
