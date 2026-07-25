<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="20" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m19 15-3 12 4 4v11h5V31l4-4-3-12z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M20 42h-8v-4l8-8zm5 0h8v-4l-8-8z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m22 17 3-8 4 1-2 8z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M30 2a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM25 7h10v6a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
