<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M8 4h2v36H8zM38 4h2v36h-2zM8 26h32v3H8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <circle cx="14" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m16 15 14 3-1 5-14-3zM15 19l4 1v7h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m27 20 6 2-2 18h-5l3-16zm5 3 3 1-1 16h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M6 40h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
