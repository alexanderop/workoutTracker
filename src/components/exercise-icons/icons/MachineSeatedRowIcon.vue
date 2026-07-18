<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="15" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m13 15-1 14 6 1 2-13zM18 28l14 2v4l-14-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m16 17 12 1v3l-12-1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M40 6h2v36h-2zM28 18h12v3H28zM32 26h3v9h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M10 31h10v3H10zM13 34h3v6h-3zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
