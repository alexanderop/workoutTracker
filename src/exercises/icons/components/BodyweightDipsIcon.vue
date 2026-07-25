<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="27" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m24 11-2 16 6 1 2-16z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m23 13-8 9 3 3 7-8z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m23 26 8 6-9 8-3-3 6-5-4-3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M6 21h18v3H6zM8 24h3v16H8zM19 24h3v16h-3zM4 42h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
