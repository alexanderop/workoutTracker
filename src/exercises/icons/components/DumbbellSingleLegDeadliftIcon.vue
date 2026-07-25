<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="36" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M18 18l13-3 2 5-13 3zM4 12l14 5-1 5-14-6zM19 22l-2 16h5l1-15zM29 18h5l-1 11h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M27 30h9v2h-9zM25 28h3v6h-3zm10 0h3v6h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 38h34v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
