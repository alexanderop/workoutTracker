<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="39" cy="20" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M34 23 24 32 6 36 5 40 25 37 37 28z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M33 25 38 26 39 40 34 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
