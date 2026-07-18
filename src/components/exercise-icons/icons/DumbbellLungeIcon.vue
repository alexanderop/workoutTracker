<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="22" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M20 11l-2 15h8l-1-15zM18 26l-8 6 3 4 7-6zM10 32l-1 8h5l1-6zM24 26l11 11-2 3-11-10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M19 12l-3 13 3 1 3-13zm7 0 3 13-3 1-3-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M13 27h8v2h-8zM11 25h3v6h-3zm8 0h3v6h-3zM24 27h8v2h-8zM22 25h3v6h-3zm8 0h3v6h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
