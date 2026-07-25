<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="17" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M14 13 20 13 19 27 13 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M19 14 27 10 28 13 20 18zM14 15 11 22 14 23 17 17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M17 25 21 25 27 28 27 34 23 34 23 30 17 29z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M13 25 17 26 14 40 10 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M24 34h7v6h-7zM31 28h7v12h-7zM38 22h6v18h-6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
