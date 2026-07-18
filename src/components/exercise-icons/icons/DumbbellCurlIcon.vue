<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m19 13-4 15 5 3v13h5V29l5-5-2-11zM20 43h-7l5-15 4 3zm5 0h8l-5-19-4 5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m17 16-7 10 4 3 7-8zm11 1 7 10-4 3-8-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <g fill="var(--exercise-icon-equipment, var(--primary))">
      <path d="m7 23 3-2 6 9-3 2zM5 22l3-2 5 7-3 2zm9 7 3-2 3 5-3 2z" />
      <path d="m41 23-3-2-6 9 3 2zm2-1-3-2-5 7 3 2zm-9 7-3-2-3 5 3 2z" />
    </g>
  </ExerciseIconSvg>
</template>
