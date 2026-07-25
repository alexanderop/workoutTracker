<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m18 16 5 2-1 12-6-1zM17 29l-6 11h5l4-10zm5 1 6 10h-5l-4-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m19 16 9-8 3 3-8 8z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M28 8l3 3 10-1 3-4-5-4z" fill="var(--exercise-icon-equipment, var(--primary))" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
