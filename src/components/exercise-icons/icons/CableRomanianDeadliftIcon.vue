<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="13" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M16 17l14 3-1 5-14-3zM30 22l2 2-2 16h-4l3-15zM27 24l-4 16h-4l5-17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m14 19-2 11 4 1 3-11z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M4 6h2v34H4zM4 34h4v4H4zm3 1 7-5 2 3-7 5z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
