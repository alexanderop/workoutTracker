<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="27" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 14-4 13 8 6 9-2-1-5-7 1-4-3 4-8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M25 32l-9-5-8 7 3 4 6-5 7 5h7l5-7-4-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M26 17l8-3 2 4-8 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M8 15h32v3H8zM5 12h4v9H5zm34 0h4v9h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M7 40h35v2H7z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
