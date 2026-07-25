<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="8" cy="31" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m10 32 14 2v4l-14 1z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m23 33 16-11 3 3-17 12z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m24 36 17-3 1 4-17 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
