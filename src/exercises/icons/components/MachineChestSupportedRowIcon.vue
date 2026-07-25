<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="27" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 15 6 2 3 13-6-1zM30 28l-7 4 2 4 6-3zM24 34l-2 6h4l2-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m28 17 9 3-1 8h-4l1-5-6-2z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M31 27h7v3h-7zM35 30h3v10h-3z" fill="var(--exercise-icon-equipment, var(--primary))" />
    <path
      d="m19 13 4-1 4 17-4 1zM28 31h8v3h-8zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
