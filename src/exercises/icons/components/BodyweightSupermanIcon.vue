<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="36" cy="21" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M33 27 20 35 23 40 36 31z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M33 28 43 20 45 23 35 32z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 34 4 24 3 27 20 38z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
