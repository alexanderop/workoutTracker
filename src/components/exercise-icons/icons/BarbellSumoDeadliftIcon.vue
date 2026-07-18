<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
import BarbellGlyph from '../BarbellGlyph.vue'
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
    <BarbellGlyph :y="32.5" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
