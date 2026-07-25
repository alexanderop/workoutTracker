<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="8" cy="34" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M9 32 33 22 36 26 12 38z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M32 23 37 25 37 41 32 41z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M12 38 23 38 23 41 12 41z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
