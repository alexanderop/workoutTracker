<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M15 15 21 17 19 30 12 28z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M17 17 31 19 31 22 16 21z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M15 28 38 29 38 33 14 32z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M13 28 24 30 24 34 12 32zM21 30 26 32 25 41 20 41z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
