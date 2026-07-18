<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="26" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M23 13 29 16 21 30 15 27z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M25 14 40 17 40 21 24 18z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M25 32 16 27 8 34 11 38 17 33 24 38 31 38 36 31 32 28z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
