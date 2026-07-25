<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 13-3 14 4 2-2 13h4l1-9 1 9h4l-2-13 4-2-3-14z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m19 14-9 3 1 4 9-2zm10 0 9 3-1 4-9-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M4 4h2v38H4zM42 4h2v38h-2zM3 5h5v4H3zM40 5h5v4h-5zM5 8l4 12 3-1-4-11zM43 8l-4 12-3-1 4-11z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
