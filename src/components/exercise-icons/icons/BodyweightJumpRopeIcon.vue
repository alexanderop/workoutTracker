<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 11 27 11 26 25 21 25z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M22 12 14 20 17 23 24 17zM26 12 34 20 31 23 24 17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 24 27 24 28 29 25 34 20 33z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M13 21a11 16 0 0 0 22 0h-3a8 13 0 0 1-16 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
