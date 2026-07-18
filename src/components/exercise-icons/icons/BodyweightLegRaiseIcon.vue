<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="7" cy="31" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M11 30l14 1v6l-14 1zM24 31 32 8l4 2-7 23z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 38h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
