<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="40" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m37 18-16 4-16 16 3 2 15-14 15-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m33 21-5 19h4l4-18zm5 1-7 18h4l6-17z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
