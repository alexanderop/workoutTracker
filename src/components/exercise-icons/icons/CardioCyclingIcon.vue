<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M5 32a7 7 0 0 1 14 0 7 7 0 0 1-14 0zM8 32a4 4 0 0 0 8 0 4 4 0 0 0-8 0zM29 32a7 7 0 0 1 14 0 7 7 0 0 1-14 0zM32 32a4 4 0 0 0 8 0 4 4 0 0 0-8 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M18 24 21 23 26 34 23 35zM31 22 33 24 26 34 23 33zM19 23 32 21 32 24 19 26zM33 23 36 32 33 33 30 24zM12 31 25 32 25 35 12 34zM29 19h5v2h-5zM15 21h6v2h-6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <circle cx="30" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M25 12 29 14 23 24 20 21z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M26 14 29 13 33 19 31 21z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M19 21 23 22 29 27 26 35 23 34 26 28z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M20 23 23 24 26 30 23 32z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
