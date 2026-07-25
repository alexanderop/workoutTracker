<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="22" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M19 11 25 12 24 26 18 25zM20 13 27 20 24 23 18 16z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M20 24 31 22 32 26 21 29zM29 22 33 23 34 28 29 28z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M18 25 23 27 19 40 14 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M28 28h14v12H28zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
