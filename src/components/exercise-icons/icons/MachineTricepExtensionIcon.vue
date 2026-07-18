<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="14" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m11 16-2 14 5 2 8-1v-4l-7 1 1-12zm7 16 3 1-1 9h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m11 17 8-9 11 1v3l-10-1-6 9z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M29 7h4v6h-4zm4 5 6 9-3 2-6-9zM36 21h3v21h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M6 33h10v3H6zM9 36h3v6h-3zM4 42h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
