<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="13" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M10 14 15 14 16 28 10 28zM10 26 24 27 24 31 10 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M13 15 19 25 16 27 11 18z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M23 27 33 20 36 23 26 31z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M6 12h3v16H6zM23 31 34 25 36 28 25 34zM33 20h5v5h-5z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M8 27h14v3H8zM12 30h4v12h-4zM6 42h36v2H6z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
