<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M12 8 16 9 15 18 11 17zM26 8 22 9 23 18 27 17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M15 17 20 18 18 30 13 29z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M13 28 25 29 25 42 21 42 21 33 13 32z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M11 5h20v3H11zM31 5h3v37h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M10 29h13v3H10zM14 32h4v10h-4zM6 42h36v2H6z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
