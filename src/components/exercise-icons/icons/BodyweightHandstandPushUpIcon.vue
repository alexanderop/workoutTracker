<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="36" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 30 8 1 2-14-4-14h-4l-4 14z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m20 29-6 13h4l5-11zm8 1 6 12h-4l-5-11z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
