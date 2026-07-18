<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="19" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M17 13h5l1 14h-7zM17 27h5l-1 13h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m21 27 6 1-2 9-5-1zM24 34l7-6 3 3-7 7z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m17 14-8 4 1 4 8-4z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M6 12h3v28H6zM33 26l5 1-1 5-5-1z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
