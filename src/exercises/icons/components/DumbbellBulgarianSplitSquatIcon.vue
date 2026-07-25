<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M31 29h13v3H31zM33 32h2v8h-2zm7 0h2v8h-2z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="16" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M14 13l-2 13h8l-2-13zM13 14l-2 12 3 1 2-12zM13 26l-6 5 2 4 7-5zM7 31l-1 9h5v-7z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M18 26l7 3 8-2v4l-8 2-8-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M8 28h8v2H8zM6 26h3v6H6zm8 0h3v6h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
