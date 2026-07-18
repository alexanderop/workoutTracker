<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="16" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M13 12 19 13 19 29 12 28zM13 14 10 24 13 25 17 16z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M18 26 7 30 5 40 9 41 11 34 18 31z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M18 27 28 33 35 27 38 30 29 38 15 32z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M33 30h9v10h-9zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
