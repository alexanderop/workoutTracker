<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M15 30h18v3H15zM17 33h3v7h-3zM28 33h3v7h-3zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M20 12h8l2 14H18z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="m20 13-6 9 3 2 5-8zm8 0 6 9-3 2-5-8z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M19 26l3 8-2 6h4l1-6-2-8zm10 0-3 8 2 6h-4l-1-6 2-8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M22 28h4v8h-4z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
