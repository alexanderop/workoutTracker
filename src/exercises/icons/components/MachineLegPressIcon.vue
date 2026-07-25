<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="m4 16 4-1 6 17-5 1zM5 32h12v3H5zM4 41h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="9" cy="14" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m8 18 6-1 5 14-6 2zM10 20l8 5-2 3-7-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m15 29 11-6 3 4-11 7zM26 24l7-10 4 3-8 10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m35 6 6 5-9 11-5-4z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
