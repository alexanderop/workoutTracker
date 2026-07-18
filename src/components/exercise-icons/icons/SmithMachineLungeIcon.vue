<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M22 14 27 15 26 28 21 27z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 14 15 17 14 14 20 12zM28 15 34 17 35 14 29 12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M22 26 31 29 30 34 21 30zM28 31 33 32 33 41 28 41zM22 26 26 30 17 39 13 35zM13 35 16 39 9 41 7 38z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M8 4h2v37H8zM38 4h2v37h-2zM8 14h32v3H8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
