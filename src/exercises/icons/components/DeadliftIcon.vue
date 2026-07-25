<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
import BarbellGlyph from '@/exercises/icons/BarbellGlyph.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="27" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m25 14-10 10 4 4 9-8 7 5 3-4-10-8zM18 27l7 2-4 13h-5l4-11-5-2zM28 27l6-2 4 17h-5l-4-12-5 12h-5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <BarbellGlyph :y="32.5" />
    <path d="m18 23-2 9h4l3-11zm11-2 3 11h4l-3-9z" fill="var(--exercise-icon-body, currentColor)" />
  </ExerciseIconSvg>
</template>
