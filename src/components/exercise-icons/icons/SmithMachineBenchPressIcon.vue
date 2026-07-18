<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M7 34h34v4H7zM12 29h23v4H12z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="16" cy="24" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m19 25 11 3 4-6 3 2-5 9-14-3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M8 4h2v34H8zM38 4h2v34h-2zM8 16h32v3H8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="m22 25-4-7 3-2 5 8zm8 2 4-9 3 1-3 10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
  </ExerciseIconSvg>
</template>
