<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
import BarbellGlyph from '../BarbellGlyph.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="29" cy="10" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m27 15-14 8 3 5 14-8 8 4 2-4-10-6zM14 27l7 4-5 11h-5l5-10-5-3zM28 21l5 8-2 13h-5l2-12-5-6z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <BarbellGlyph :y="31.5" :plate-height="10" />
    <path d="m18 22 1 9h4l1-12z" fill="var(--exercise-icon-body, currentColor)" />
  </ExerciseIconSvg>
</template>
