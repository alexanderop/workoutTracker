<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="34" cy="20" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M16 23l12-6 3 5-12 6zM15 26l-2 14h5l1-13zM20 27l1 13h5l-2-14zM27 18l2-5 3 1-2 5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M8 13h32v3H8zM5 10h4v9H5zm34 0h4v9h-4z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
