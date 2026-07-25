<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="38" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M34 17 38 20 10 40 6 38z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M33 20 37 21 39 40 35 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M32 21 26 27 24 24 30 18z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
