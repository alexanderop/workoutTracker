<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="22" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M19 11 25 12 24 26 18 25zM20 24 31 22 32 26 21 29zM29 22 33 23 34 28 29 28z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M18 25 23 27 19 40 14 40zM19 12l4 2-6 12-4-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M10 26h9v2h-9zM8 24h2v6H8zM19 24h2v6h-2z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M28 28h14v12H28zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
