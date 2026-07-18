<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="10" cy="26" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 34-11-4-2 4 12 5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m24 36 3-24h4l-2 24z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m14 27 12-12 3 3-12 12z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
