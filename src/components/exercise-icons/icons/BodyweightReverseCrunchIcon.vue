<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="8" cy="35" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m11 33 13-3 3 5-14 5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m24 32-6-14 4-1 6 14zM18 16l10 2-1 4-10-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
