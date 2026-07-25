<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="29" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M25 13 31 14 28 27 22 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M28 14 36 11 37 15 29 18zM26 15 18 19 20 23 27 19z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M24 25 33 27 32 39 28 39 29 30 23 29z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M22 25 26 29 14 38 11 34z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
