<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="31" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M28 14 33 15 35 28 30 29z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M28 15 22 12 24 8 30 12z" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M33 26 20 29 21 33 34 31zM20 29 25 30 22 41 17 41z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M37 5 41 6 33 41 29 40z" fill="var(--exercise-icon-equipment, var(--primary))" />
    <path d="M6 41h36v2H6z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
