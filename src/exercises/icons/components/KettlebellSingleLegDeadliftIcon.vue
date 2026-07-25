<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="36" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M18 18l13-3 2 5-13 3zM4 12l14 5-1 5-14-6zM19 22l-2 20h5l1-19z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M29 18h5l-1 7h-4z" fill="var(--exercise-icon-body, currentColor)" />
    <g transform="translate(0 12) scale(0.8)">
      <path
        d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
        fill="var(--exercise-icon-equipment, var(--primary))"
      />
    </g>
    <path d="M6 42h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
