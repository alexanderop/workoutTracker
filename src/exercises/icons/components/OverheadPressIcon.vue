<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
import BarbellGlyph from '@/exercises/icons/BarbellGlyph.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="13" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m20 18-4 11 4 4v11h5V32l4-4-2-10zM20 43h-7v-4l7-9zm5 0h8v-4l-8-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <BarbellGlyph :y="6.5" />
    <path
      d="m19 21-5-12 4-2 6 12zm10 0 5-12-4-2-6 12z"
      fill="var(--exercise-icon-body, currentColor)"
    />
  </ExerciseIconSvg>
</template>
