<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 13-3 14 4 2-2 13h4l1-9 1 9h4l-2-13 4-2-3-14z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m20 14-7 6 10 11 3-3-8-8 5-4zm8 0 7 6-10 11-3-3 8-8-5-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M4 4h2v38H4zM42 4h2v38h-2zM3 5h5v4H3zM40 5h5v4h-5zM6 6l21 22-2 2L4 8zM42 6 21 28l2 2 21-22z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
