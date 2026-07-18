<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="10" cy="17" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M14 17l16-1 1 5-16 1zM13 18l4 1-3 9-3-1z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m29 20 6 1-2 13-5-1zM28 33l7 1 1 3h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M27 12h10v4H27zM31 4h3v8h-3zM8 27h3v14H8z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M30 37h10v4H30zM6 41h36v2H6z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
