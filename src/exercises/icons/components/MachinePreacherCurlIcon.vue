<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="14" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m11 14-1 15 5 2 8-1v-4l-7 1 1-12zm7 16 3 1-1 10h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m12 15 2-3 11 10 3-7 3 2-5 10-4-2z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m19 19 13 4-2 9-13-4zM24 30h3v11h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M6 31h9v3H6zM8 34h3v7h-3zM4 41h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
