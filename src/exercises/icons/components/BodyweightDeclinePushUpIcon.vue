<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="41" cy="28" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m10 24 26 5-1 5-25-5z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m33 31-1 9h4l3-9z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M6 29h12v11H6zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
