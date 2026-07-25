<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="20" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M17 13h5l1 15-3 3-5-3zM20 27l8 1v4l-8-1zM24 31h4l1 9h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m22 13 16-2 1 4-17 2z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M12 10h4v16h-4zM13 26h2v14h-2z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M15 31h10v3H15zM19 34h3v6h-3zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
