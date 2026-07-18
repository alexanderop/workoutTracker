<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="33" cy="11" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m30 14-16 9 3 5 15-9zM14 24l7 4-6 12h-5l6-10-5-3zm7 4 6-2 5 14h-5l-4-10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m30 17-2 9-5-1 2-9z" fill="var(--exercise-icon-body, currentColor)" />
    <g transform="translate(-4 14) scale(0.8)">
      <path
        d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
        fill="var(--exercise-icon-equipment, var(--primary))"
      />
    </g>
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
