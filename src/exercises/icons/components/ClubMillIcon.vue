<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 14 5 1-1 13h-6zM19 28h7l3 12h-5l-2-8-2 8h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M23 15l-3-9-6 3 2 5z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M13 10h2l2 9-1 6h-5l-1-6z" fill="var(--exercise-icon-equipment, var(--primary))" />
    <path d="M6 40h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
