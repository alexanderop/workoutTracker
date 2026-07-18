<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 10 27 10 26 26 22 26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 11 18 24 21 25 24 13zM27 11 30 24 27 25 24 13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 25 27 25 28 34 22 34zM21 34 28 35 29 41 24 41z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 41h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
