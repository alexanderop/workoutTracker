<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="19" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M17 12 22 13 21 27 16 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M16 13 11 8 14 5 19 10z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M17 25 8 28 9 32 18 30zM9 28 13 30 11 42 6 42z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M38 36h6v5h-6zM40 37 26 13 29 11 43 35zM19 11h9v4h-9z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
