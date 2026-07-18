<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="15" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m12 14-2 15 6 2 8-1v-4l-7 1 1-11zm8 16 3 1-1 10h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m12 16 2-3 10 9 3-6 3 2-5 9-4-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m20 24 11-4 2 4-11 4zM26 27h3v14h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M8 31h10v3H8zM11 34h3v7h-3zM4 41h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
