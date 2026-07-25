<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="8" cy="25" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M11 28 3 18 6 16 14 25z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M10 28 22 36 20 40 9 33z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 36 42 25 44 28 23 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
