<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M32 6v3l-20 2-4-5 4-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <circle cx="23" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m22 15 5 1-1 13h-6zM20 29h7l3 11h-5l-2-8-2 8h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m25 14 2-7 5 1-2 7z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M6 40h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
