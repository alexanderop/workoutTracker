<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="22" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m19 18-2 12 3 3-2 9h4l1-8 1 8h4l-2-9 3-3-2-12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m18 17 8-11 3 3-8 10zm6 1 5-9 4 2-5 9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M33 3a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM28 8h10v6a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
