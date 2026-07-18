<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="m7 32 12-13 2 2-12 13zM4 42h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="26" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m23 17-11 12 3 4 12-11zm-11 13 11 2v4l-7-1v7h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m23 19 4-8 3 1-4 9zm5 2 5-9 3 2-5 9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M8 4h2v36H8zM38 4h2v36h-2zM8 10h32v3H8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
