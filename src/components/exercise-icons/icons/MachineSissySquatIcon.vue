<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="15" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m14 11 5-3 10 16-5 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 24 5 1 4 7-2 8h-4l2-7-4-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m18 13 10-1 1 4-10 1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M33 33h5v4h-5zM35 37h2v3h-2z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
