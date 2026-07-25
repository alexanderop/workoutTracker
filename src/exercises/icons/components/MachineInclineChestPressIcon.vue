<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="m5 17 4-1 3 14-5 1zM6 31h14v3H6zM5 42h38v2H5z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="15" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m12 15-2 15 5 1 3-14zM10 29l13 1v4h-9v8h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m14 17 13-9 2 3-13 10zm3 4 13-9 2 3-13 10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M33 6h3v36h-3zM29 4h3v11h-3z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
