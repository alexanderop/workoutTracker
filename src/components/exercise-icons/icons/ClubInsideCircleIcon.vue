<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="26" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m23 13 6 1-2 14h-6zM18 27l4 1-3 12h-5zm8 1 4-1 4 13h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m24 14 3 3-9 8-3-3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M15 21l2 2-6 11h-4l-2-5z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M5 40h38v2H5z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
