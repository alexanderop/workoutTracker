<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 10 27 11 26 23 20 22z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 11 13 16 15 20 22 15zM27 11 35 16 33 20 26 15z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 21 31 14 35 17 30 29 26 28 29 19 23 26z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
