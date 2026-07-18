<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M8 31h14v3H8zM11 34h4v8h-4zM6 42h36v2H6z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="16" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m13 14-1 16 5 1 2-16zM12 28l12 1v4h-8v9h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m15 16 16 2v4l-16-1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M33 8h3v34h-3zM30 14h3v10h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
