<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="25" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M22 11 28 12 27 26 21 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M27 13 32 21 29 23 24 16zM22 13 17 21 20 23 25 16z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M24 25 29 26 31 40 27 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 25 26 26 21 40 17 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
