<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="12" cy="35" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m24 14-11 17 4 2 10-16z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m25 14 13 25-4 2-12-25z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m14 30-7 9 3 2 6-9z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
