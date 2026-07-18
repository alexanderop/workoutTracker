<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M17 31h14v3H17zM22 34h4v6h-4zM8 40h32v2H8z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 13-2 17h10l-2-17zM20 30l-1 10h4l1-10zm5 0 1 10h4l-1-10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m21 14-9 3 1 4 8-3zm6 0 9 3-1 4-8-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M10 11h3v17h-3zM35 11h3v17h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
