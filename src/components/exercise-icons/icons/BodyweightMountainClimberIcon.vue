<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="38" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M34 16l5 1-1 22h-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m34 17-27 17 2 4 26-17z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 24 9-1 2 4-9 1zM28 26l4 1-2 10-4-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
