<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="12" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m16 15-6 11 7 3 4-10zM10 26l6 4-3 10h-5l3-8-4-3zm6 4 5-2 3 12h-5l-2-8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m19 16 12 9-3 4-11-8z" fill="var(--exercise-icon-body, currentColor)" />
    <g transform="translate(-5 9)">
      <path
        d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
        fill="var(--exercise-icon-equipment, var(--primary))"
      />
    </g>
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
