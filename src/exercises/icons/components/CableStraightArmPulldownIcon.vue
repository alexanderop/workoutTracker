<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="16" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m15 14-3 12 6 1 2-12zM12 25l6 2-4 13h-5l4-11-3-1zm6 2 4-1 3 14h-5l-2-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m19 15 13 10-2 4-13-11z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M40 3h2v37h-2zM33 3h9v4h-9zM27 26h8v3h-8zM35 5l3 1-4 21-3-1z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
