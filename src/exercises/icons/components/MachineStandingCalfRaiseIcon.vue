<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 10h6l-1 16h-4zM21 11 18 24l3 1 3-12zM27 11l3 13-3 1-3-12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M22 26h5l1 8h-7zM21 34l7 1 1 3h-5l-3-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M14 4h3v7h-3zm17 0h3v7h-3zM14 9h9v3h-9zm11 0h9v3h-9z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M19 38h11v3H19zM4 41h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
