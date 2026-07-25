<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="7" cy="30" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M12 25 23 11 27 14 15 28z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M24 11 28 13 41 40 37 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M12 26 16 28 12 40 8 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
