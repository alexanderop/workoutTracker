<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M7 34h34v4H7zM12 29h23v4H12z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="16" cy="24" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m19 25 11 3 4-6 3 2-5 9-14-3z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m22 26-7-11 3-2 6 10zm6 1 7-12 3 2-7 12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M12 11h8v2h-8zM10 8h3v8h-3zM19 8h3v8h-3zM32 13h8v2h-8zM30 10h3v8h-3zM39 10h3v8h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
