<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M9 34a15 4 0 0 1 30 0 15 4 0 0 1-30 0zM12 34a12 2 0 0 0 24 0 12 2 0 0 0-24 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 12 27 12 26 24 21 24z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M26 14 32 19 30 22 24 17zM22 14 16 19 18 22 24 17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M20 23 24 24 17 34 13 32z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M24 23 28 24 35 33 31 35z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
