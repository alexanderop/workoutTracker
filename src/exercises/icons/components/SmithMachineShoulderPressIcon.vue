<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M8 4h2v36H8zM38 4h2v36h-2zM8 9h32v3H8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M15 33h8v3h-8zM17 36h3v6h-3zM6 42h36v2H6z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="24" cy="17" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 20 7 1-2 12-6-1zM21 32l11 1v4h-7v5h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m21 21-6-8 3-2 6 8zm6 0 4-9-3-2-4 9z" fill="var(--exercise-icon-body, currentColor)" />
  </ExerciseIconSvg>
</template>
