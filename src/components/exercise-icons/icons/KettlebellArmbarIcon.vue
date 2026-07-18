<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="9" cy="36" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M14 35l1-20h4l2 20zM13 33l14 2 17 1v4l-17-1-14-2zM26 35l6-9 3 3-6 9zM31 28l4-2 4 12-4 2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M17 4a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM12 9h10v6a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
