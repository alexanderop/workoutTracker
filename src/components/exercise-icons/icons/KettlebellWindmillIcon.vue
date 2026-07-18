<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="28" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m25 16 4 4-10 9-4-4zM15 25l3 3-8 13-4-1zm3 0-3 3 13 13 3-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m28 17-2 3 9 1 1-4zM24 19l-3 2-15 16 3 2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <g transform="translate(8 -10) scale(0.8)">
      <path
        d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
        fill="var(--exercise-icon-equipment, var(--primary))"
      />
    </g>
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
