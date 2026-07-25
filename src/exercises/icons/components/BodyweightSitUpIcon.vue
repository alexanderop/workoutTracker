<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="12" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m13 19 4-2 9 17-5 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m14 20 8 4-2 4-8-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m23 35 7-8 3 3-7 8zM30 28l4-1 5 10-4 2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
