<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="28" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m25 12 4 2-5 13-5-2zM26 14l8 4-1 3-8-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M18 25h8v3h-8zM21 28h3v9h-3zM17 37h11v4H17z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="m19 25 13 3v6h-6l1-4-8-1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M4 34h14v3H4zM26 34h18v3H26zM6 37h3v6H6zm33 0h3v6h-3z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
