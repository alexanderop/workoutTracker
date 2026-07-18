<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 13h8l-1 11h-6zM21 24l4 3-10 13h-5zm6 0-4 3 10 13h5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m20 13-3 3 4 10 3-1zm8 0 3 3-4 10-3-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <g transform="translate(-5 11) scale(0.8)">
      <path
        d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
        fill="var(--exercise-icon-equipment, var(--primary))"
      />
    </g>
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
