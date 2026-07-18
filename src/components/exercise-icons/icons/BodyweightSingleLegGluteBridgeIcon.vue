<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="7" cy="34" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M8 32 26 24 29 28 11 38z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M25 24 33 23 36 41 31 41 30 27 27 29z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M25 23 38 9 41 12 28 27z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M11 38 21 38 21 41 11 41z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
