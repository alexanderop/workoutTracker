<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M15 9h18v3H15zM16 3h2v6h-2zM29 3h2v6h-2z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <circle cx="9" cy="32" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m12 31 11 1v5H12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m22 34 6-1-1-21h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M8 37h24v3H8zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
