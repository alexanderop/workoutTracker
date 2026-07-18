<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="38" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m7 30 15-12 4 5-15 12zM24 21l10-8 4 5-10 7z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m31 17 3 2-2 7-4-2z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M4 33h9v3H4zM23 31h3v9h-3zM19 29l8-6 3 4-8 6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
