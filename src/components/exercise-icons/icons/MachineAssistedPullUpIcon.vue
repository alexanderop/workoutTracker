<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="14" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M20 18h8l-1 12h-6zM21 29l6 2-1 5-6-2zm5 2 8 1-1 4-8-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m17 7 4 1-1 11-4-1zm14 0-4 1 1 11 4-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M6 4h30v3H6zM6 4h2v38H6zM24 36h12v3H24z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
