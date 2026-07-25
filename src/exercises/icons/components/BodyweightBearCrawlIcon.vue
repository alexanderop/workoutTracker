<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="38" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M16 17l18 2v4l-18-1zM33 21h4l1 19h-4zM16 18l5 2 2 9-4 1zM23 29l-1 11h-4l1-11z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
