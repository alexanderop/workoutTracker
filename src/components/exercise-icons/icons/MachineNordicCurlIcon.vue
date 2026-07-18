<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="13" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m14 16 5-2 11 19-5 3z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M27 34l13 1v4l-13 1z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m13 17-3 11 4 1 3-11z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M35 31h7v4h-7zM40 35h2v5h-2z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
