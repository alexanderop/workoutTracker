<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="16" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m12 14-4 14 5 3v11h5V30l5-5-3-11zM13 42H6l5-14 4 3zm5 0h8l-5-17-4 4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m11 15 3-1 3 7 8 3-1 3-10-3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M41 4h2v37h-2zM39 6h5v5h-5zM22 24h8v2h-8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="m40 10 2 2-12 13-2-2z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
