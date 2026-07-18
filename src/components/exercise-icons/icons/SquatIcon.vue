<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
import BarbellGlyph from '../BarbellGlyph.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="27" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m24 14-6 12 8 7 9-2-1-5-7 1-4-4 6-7zM25 32l-9-5-8 7 3 4 6-5 7 5h7l5-7-4-3z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <BarbellGlyph :y="16.5" :plate-height="10" />
    <path d="m18 16 4-2 4 4-3 4z" fill="var(--exercise-icon-body, currentColor)" />
    <path d="M7 40h35v2H7z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
