<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="25" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M22 11 28 12 27 27 21 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M23 13 15 18 17 22 24 17zM27 13 34 9 36 12 29 17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M21 26 27 27 26 41 21 41 23 30z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M23 25 33 16 37 19 36 29 32 28 32 22 25 29z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
