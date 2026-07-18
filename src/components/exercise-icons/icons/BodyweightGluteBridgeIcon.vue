<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="8" cy="35" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M9 33 24 29 33 23 36 27 26 33 11 38z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M33 24 37 26 37 41 32 41z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M12 38 23 38 23 41 12 41z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
