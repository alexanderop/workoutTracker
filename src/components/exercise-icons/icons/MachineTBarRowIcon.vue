<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="29" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m27 15-14 8 3 5 14-8 8 4 2-4-10-6zM14 27l7 4-5 9h-5l5-8-5-3zM28 21l5 8-2 11h-5l2-10-5-6z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m18 22 1 9h4l1-12z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 30 19 7-1 3-19-7zM17 27h4v9h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
