<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 17-3 13 3 3h5l3-3-3-13zM20 30l-9 9 3 3 8-9zM24 30l9 9-3 3-8-9zM21 18l-6 8 3 2 5-7z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m21 17 4-11 4 2-3 10z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M28 2a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5zM23 7h10v6a5 5 0 0 1-10 0z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
