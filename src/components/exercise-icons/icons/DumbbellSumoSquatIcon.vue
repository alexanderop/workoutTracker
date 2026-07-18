<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M20 11h8l2 12-6 2-6-2z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M20 23l-8 7 2 10h4l-2-8 7-6zm8 0 8 7-2 10h-4l2-8-7-6z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m20 12 2 14h4l2-14-4 2z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M23 26h2v9h-2zM20 25h8v3h-8zM20 33h8v3h-8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
