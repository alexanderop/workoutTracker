<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path d="m32 4 5 2-9 34-5-2z" fill="var(--exercise-icon-equipment, var(--primary))" />
    <circle cx="25" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 12 5 2-4 13-5-2zM26 13l4-7 3 2-4 7z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m20 25 9 6-3 4-8-6zM26 32l4 2-2 6h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M12 40h26v3H12z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
