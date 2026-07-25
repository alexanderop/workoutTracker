<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="35" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M14 18 32 17 33 22 15 23z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M28 19 33 19 34 40 29 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M14 20 19 21 15 40 10 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M32 17 44 12 45 15 33 21zM14 18 3 13 2 16 13 22z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
