<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="22" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m19 14-2 13 3 4-3 11h4l2-9 1 9h4l-2-11 2-4-2-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m23 15 8 5-2 4-8-5zm6 8 2-8 4 1-2 8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M33 13a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM28 18h10v8a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
