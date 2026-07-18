<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M18 24h12v3H18zM21 27h6v13h-6zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="24" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M20 13h8l1 11H19z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 23-10 12 4 3 9-11zm8 0 10 12-4 3-9-11z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M6 33h6v5H6zM36 33h6v5h-6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
