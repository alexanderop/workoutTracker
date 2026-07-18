<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="17" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m14 14-1 13 7 1 1-13zM14 26l14 1v4l-14-1zM23 30l5 1-1 7h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m19 16 8 5-2 3-7-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M22 22h8v5h-8zM27 8h3v14h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M10 29h9v3h-9zM12 32h3v8h-3zM22 38h7v2h-7zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
