<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="34" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m31 13-1 13 3 3-2 11h4l1-10 2 10h4l-3-12 1-2-3-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m32 13-11-1v4l11 1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M4 4h2v36H4zM4 12h5v4H4zM9 13h13v3H9z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
