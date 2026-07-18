<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 10 27 10 26 24 22 24z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M22 11 12 6 13 3 24 8zM26 11 36 6 35 3 24 8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 23 25 26 15 40 11 38zM27 23 23 26 33 40 37 38z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
