<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="23" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m19 27 9 5 6-7 4 3-8 10-12-5-8 7-4-4zM27 33l8 7h8v4H33l-9-7-8 7H8l10-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m20 27 5-15 4 1-4 17z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M28 4a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM23 9h10v6a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M3 44h42v2H3z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
