<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="28" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M25 11 30 13 27 28 21 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M26 13 34 17 32 21 25 17zM24 13 17 19 20 22 26 17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M23 26 33 30 31 41 27 41 29 33 21 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 26 13 33 11 27 15 27 16 31 24 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
