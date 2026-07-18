<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 18-2 12 3 3-2 9h4l1-8 1 8h4l-2-9 3-3-2-12zM20 19l-3 10 3 1 3-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m22 18 3-11 4 1-2 11z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M28 2a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM23 7h10v6a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
