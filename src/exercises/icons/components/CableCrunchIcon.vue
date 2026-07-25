<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="16" cy="22" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 22 11 5-1 4-11-5zM28 27l5 2-4 10-5-1zM25 37h10v3H25z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m19 24 4 1-1-8-3 1z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M42 4h2v36h-2zM37 4h5v4h-5zm2 2 3 3-19 11-2-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
