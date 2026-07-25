<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 10 27 11 26 25 21 24z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 11 13 18 15 21 23 15zM27 11 35 18 33 21 25 15z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 24 26 25 22 36 17 35zM25 25 27 24 31 35 26 36z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
