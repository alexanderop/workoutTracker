<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="38" cy="19" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m34 21-14 2 1 5 14-2z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m31 24-1 16h4l2-16z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 24-7 10 3 2 6-8zm-6 11-4 5h4l3-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M6 40h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
