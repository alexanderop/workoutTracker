<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="21" cy="14" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m19 17 9 10-2 4-10-9zm5 13 10 1 7 6-2 3-7-6-9-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m19 17-8 3 2 7h4l-2-5 5-2z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M5 26h12v3H5zM6 29h3v11H6zM14 29h3v11h-3zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
