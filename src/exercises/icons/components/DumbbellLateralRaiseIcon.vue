<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 13-2 14 3 4-3 11h4l1-9 1 9h4l-3-11 3-4-2-14z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m21 14-13-4-1 4 13 4zm6 0 13-4 1 4-13 4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M4 5h7v3H4zM6 8h3v7H6zM4 15h7v3H4zM37 5h7v3h-7zM39 8h3v7h-3zM37 15h7v3h-7z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
