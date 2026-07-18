<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="20" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m18 13-3 13 4 3-2 13h4l1-11 3 11h4l-4-13 1-3-2-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m22 15 4-9 4 2-4 9zm4-7 4 1 2 9-4 1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M30 15a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM25 20h10v8a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
