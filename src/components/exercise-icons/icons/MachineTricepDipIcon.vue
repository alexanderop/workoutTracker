<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="16" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m13 13-2 16 5 2 8-1v-4l-7 1 1-13zm7 17 3 1-1 10h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m12 15 3-2 10 13-3 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M20 27h9v3h-9zm8 1 6-9 3 2-6 9zM35 17h3v24h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M8 31h10v3H8zM11 34h3v7h-3zM4 41h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
