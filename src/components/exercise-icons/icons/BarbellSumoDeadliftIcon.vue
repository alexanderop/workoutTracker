<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M21 12l-1 11h8l-1-11zM20 13l-2 18h3l2-17zm8 0 2 18h-3l-2-17z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M20 23 8 32l-2 6h5l1-5 9-8zm8 0 12 9 2 6h-5l-1-5-9-8z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M7 31h34v3H7zM4 27h5v11H4zm35 0h5v11h-5z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
  </ExerciseIconSvg>
</template>
