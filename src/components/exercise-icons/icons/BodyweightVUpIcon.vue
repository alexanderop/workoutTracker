<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="10" cy="17" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m22 38-12-16 4-3 12 16z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m25 36 13-16 3 3-13 16z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M14 22l19-3 1 4-19 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
