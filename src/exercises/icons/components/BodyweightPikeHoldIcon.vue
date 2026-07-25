<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="10" cy="31" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m25 11 4 3-12 14-4-3zM13 25l4 3-3 12-4-1zM26 11l4 2 12 25-4 2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
