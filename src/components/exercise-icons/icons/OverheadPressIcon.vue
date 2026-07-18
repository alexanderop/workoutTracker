<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 18-4 11 4 4v11h5V32l4-4-2-10zM20 43h-7v-4l7-9zm5 0h8v-4l-8-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M7 5h34v3H7zM4 2h5v9H4zm35 0h5v9h-5z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="m19 21-5-12 4-2 6 12zm10 0 5-12-4-2-6 12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
  </ExerciseIconSvg>
</template>
