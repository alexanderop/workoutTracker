<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="9" cy="32" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m12 31 4 1 1 8h-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m12 29 13-14 4 3-13 15z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m25 16 4-2 12 26h-5z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
