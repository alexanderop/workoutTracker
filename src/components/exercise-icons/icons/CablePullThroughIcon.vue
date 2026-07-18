<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="10" cy="19" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m13 17 15 4-2 5-14-3zM15 21l11 10-3 3-11-10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m26 23 6 3-4 14h-5l5-13zm5 3 4 1-2 13h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M41 6h2v34h-2zM39 34h5v4h-5zm-14-4 15 5-1 3-15-5z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
