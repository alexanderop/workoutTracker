<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="18" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m16 13 5 1-1 13h-6zM15 27h7l3 12h-5l-2-8-2 8h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="m17 15 10-10 3 3-10 10z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M30 4h2l2 9-1 6h-5l-1-6z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M6 40h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
