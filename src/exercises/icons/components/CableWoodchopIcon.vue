<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="20" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m18 14-3 13 7 2 3-14zM16 27l-3 13h5l4-11zm6 2 5 11h5l-6-12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m17 15-8 9 3 3 8-8z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M40 4h2v38h-2zM36 4h5v4h-5zm-24 20 25-16 2 3-25 16z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 42h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
