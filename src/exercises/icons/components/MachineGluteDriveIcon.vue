<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M3 25h10v3H3zM5 28h2v12H5zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="7" cy="19" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M11 22l13-3 3 5-13 4zM25 20l9 4-2 4-8-4zM34 26l-2 14h-5l3-14z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M20 13h9v5h-9zM23 5h3v8h-3z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
