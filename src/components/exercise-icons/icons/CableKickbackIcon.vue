<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="17" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M14 13 19 14 22 27 17 28z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M15 14 6 18 7 21 16 18z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M17 26 22 27 21 42 16 42zM20 26 35 24 36 28 21 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M4 6h2v34H4zM3 34h6v4H3zM8 35 37 27 38 30 9 38z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
