<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M3 25h11v3H3zM5 28h2v12H5zM4 40h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="7" cy="19" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M11 22l13-3 3 5-13 4zM25 20l9 4-2 4-8-4zM34 26l-2 14h-5l3-14z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 14h8v4h-8zM27 16 41 11l1 3-14 5zM40 8h3v32h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
