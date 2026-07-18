<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="22" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M25 11 19 12 20 27 26 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M25 13 29 21 26 23 22 16z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M24 25 12 28 10 41 15 41 15 32 23 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M26 25 22 30 31 39 35 35zM35 35 32 39 42 41 44 38z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
