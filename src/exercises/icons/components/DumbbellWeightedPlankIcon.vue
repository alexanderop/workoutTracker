<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="38" cy="19" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m35 22-15 1-11 7 3 5 10-6 14 1 5-5zM20 27l-1 6H9v4h15l3-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M24 17h8v3h-8zM20 14h4v9h-4zm12 0h4v9h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 38h40v3H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
