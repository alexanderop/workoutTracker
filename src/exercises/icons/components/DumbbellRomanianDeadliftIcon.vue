<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="33" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M16 20l13-4 2 5-13 4zM27 18h5l-1 11h-4zM15 24l-2 16h5l1-15zM20 25l1 15h5l-2-16z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M25 30h9v2h-9zM23 28h3v6h-3zm10 0h3v6h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
