<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 12 27 12 26 27 21 27z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M22 13 16 4 19 2 25 11zM26 13 32 4 29 2 23 11z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 26 25 27 22 36 17 34zM25 26 27 26 30 35 25 36z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
