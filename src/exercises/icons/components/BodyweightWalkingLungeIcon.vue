<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="27" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M24 11 30 12 29 27 23 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M25 13 33 19 31 22 24 17zM25 13 18 19 20 22 26 17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M25 25 37 28 39 41 34 41 34 32 26 30z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M23 25 27 30 10 41 7 38z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
