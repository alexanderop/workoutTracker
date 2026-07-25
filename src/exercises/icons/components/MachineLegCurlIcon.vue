<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="14" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M12 14h6l1 13h-8z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m13 25 15 2 3 10-4 1-2-8-12-1z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m27 29 9 6-3 5-7-5z" fill="var(--exercise-icon-equipment, var(--primary))" />
    <path
      d="M7 12h3v15H7zM8 27h14v3H8zM11 30h3v10h-3zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
