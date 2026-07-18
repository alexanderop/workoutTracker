<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="26" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M23 11 29 12 28 27 22 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M23 13 19 21 22 23 26 16z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M24 25 36 28 38 41 33 41 33 32 25 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M22 25 26 30 17 39 13 35zM13 35 16 39 6 41 4 38z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
