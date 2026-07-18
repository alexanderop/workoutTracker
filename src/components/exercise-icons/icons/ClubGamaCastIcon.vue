<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="26" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 15 5 2-3 13-6-1zM21 29l-5 11h5l3-9zm4 1 6 10h-5l-4-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M25 16l-7-7 4-3 5 6z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M17 7l2 3-11 1-4-4 5-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M5 40h38v2H5z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
