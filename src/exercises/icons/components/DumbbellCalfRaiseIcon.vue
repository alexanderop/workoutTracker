<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 12l-1 15h10l-2-15zM20 27l-1 11 4 4h3l-4-5 2-10zm6 0 1 10 4 5h3l-4-6-1-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M19 13l-5 12 3 2 5-13zm10 0 5 12-3 2-5-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M10 27h8v2h-8zM8 25h3v6H8zm8 0h3v6h-3zM30 27h8v2h-8zM28 25h3v6h-3zm8 0h3v6h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
