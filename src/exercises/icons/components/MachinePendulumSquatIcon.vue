<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="23" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M21 15 26 16 30 29 25 30z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M22 16 16 11 19 8 24 13z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M28 27 15 29 15 34 29 32zM15 29 20 31 17 42 12 42z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M38 4h5v4h-5zM39 7 43 8 36 30 32 29zM28 24h4v9h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
