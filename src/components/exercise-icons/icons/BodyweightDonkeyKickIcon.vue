<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="8" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M9 18 30 20 31 25 10 23z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M10 21 15 21 15 40 10 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M28 22 33 23 34 40 28 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M28 20 37 10 34 4 39 3 42 13 32 24z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
