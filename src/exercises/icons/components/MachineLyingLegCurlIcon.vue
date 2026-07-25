<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M6 28h30v4H6zM10 32h3v8h-3zm19 0h3v8h-3zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="7" cy="24" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M11 22l19 3v4l-19-1zM11 27l1 9h3l-1-8zM30 26l5-11 4 2-5 12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M32 12h7v4h-7zM38 16h3v12h-3z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
