<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="14" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M10 14 16 14 17 30 10 30z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M14 15 20 26 17 28 11 17z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M10 27 27 26 28 31 10 32z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M24 27 29 28 30 40 24 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M6 4h3v36H6zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
