<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m19 13-5 14 7 6 6-1 7-7-4-4-5 6-5-4 5-10zM20 32l-9-5-7 9 4 4 5-7 7 7h7l8-7 5 7 4-4-8-10-9 6z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M20 15h9v3h-9zM22 18h5v6h-5zM20 24h9v3h-9z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
