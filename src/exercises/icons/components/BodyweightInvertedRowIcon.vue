<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M8 12h32v3H8zM8 15h2v25H8zM38 15h2v25h-2zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="13" cy="20" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m16 21 23 15-2 4-23-15z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m13 15 4 1-1 9-4-1z" fill="var(--exercise-icon-body, currentColor)" />
  </ExerciseIconSvg>
</template>
