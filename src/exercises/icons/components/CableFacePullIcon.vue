<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="17" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m17 14-2 13 3 3-3 10h4l2-9 2 9h4l-3-11 1-2-1-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m20 13 8-1 1 4-9 1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M42 4h2v36h-2zM38 4h6v4h-6zM39 6l-12 6 2 3 11-6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
