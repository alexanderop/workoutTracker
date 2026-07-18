<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="13" cy="26" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m15 28 11 6-2 5-11-4zM25 35l8-9 3 3-8 9zM33 27l3 2-1 11h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m16 28 6 4-2 3-6-3z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
