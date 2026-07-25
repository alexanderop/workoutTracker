<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="14" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m11 19-1 13 7 1 2-13z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M16 30l25-2 1 4-26 2z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m11 21-2 19h4l3-18z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
