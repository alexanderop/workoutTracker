<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M10 35h30v3H10zM29 31h8v3h-8z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <path
      d="M4 22a7 7 0 0 1 14 0 7 7 0 0 1-14 0zM7 22a4 4 0 0 0 8 0 4 4 0 0 0-8 0zM18 21h8v2h-8zM26 18h2v9h-2zM13 28h4v8h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <circle cx="38" cy="14" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M34 17 38 19 33 30 30 28z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M35 19 37 21 29 26 27 23z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M30 26 33 29 23 32 17 29 19 26 24 29z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
