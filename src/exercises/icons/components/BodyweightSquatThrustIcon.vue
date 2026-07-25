<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="38" cy="16" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M33 18 37 24 8 40 5 36z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M32 22 37 22 38 40 33 40z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
