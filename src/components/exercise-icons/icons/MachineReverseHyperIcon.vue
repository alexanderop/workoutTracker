<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="6" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M9 18l16 1 1 5-17-1zM25 19l15-7 2 4-15 8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m8 20 4 1-2 8-4-1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M6 22h22v4H6zM14 26h4v14h-4zM5 28h5v3H5z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
