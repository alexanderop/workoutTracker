<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M6 4h36v3H6zM6 7h2v6H6zm34 0h2v6h-2z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="24" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m17 7 4 1-1 9-4-1zm14 0-4 1 1 9 4-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M20 16h8l-1 11h-6zM21 27h6l-1 7h-6zM20 34h7l-2 4-5 1-2-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
