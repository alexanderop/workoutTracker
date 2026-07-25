<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="19" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m17 20 5 0 2 10-9 0z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m20 20 6-9 3 2-6 9z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M25 32l-9-5-8 7 3 4 6-5 7 5h7l5-7-4-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M29 2a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM24 7h10v5a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 40h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
