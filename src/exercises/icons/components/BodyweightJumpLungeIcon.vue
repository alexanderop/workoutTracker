<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 10 27 11 26 25 20 24z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M22 12 15 17 17 21 24 16zM26 12 33 7 35 10 28 16z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M20 23 12 27 13 36 17 36 17 31 24 29z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M24 24 33 29 38 24 41 27 34 35 21 29z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
