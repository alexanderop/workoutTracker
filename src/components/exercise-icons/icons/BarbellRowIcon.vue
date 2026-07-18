<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="29" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m27 15-14 8 3 5 14-8 8 4 2-4-10-6zM14 27l7 4-5 11h-5l5-10-5-3zM28 21l5 8-2 13h-5l2-12-5-6z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M8 30h32v3H8zM5 27h4v9H5zm34 0h4v9h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="m18 22 1 9h4l1-12z" fill="var(--exercise-icon-body, currentColor)" />
  </ExerciseIconSvg>
</template>
