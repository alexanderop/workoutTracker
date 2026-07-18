<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m21 14-1 26h8l-1-26z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 15-17 22 3 3 17-21zm8 0 17 22-3 3-17-21z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M3 40h42v2H3z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
