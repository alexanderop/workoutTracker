<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
import BarbellGlyph from '../BarbellGlyph.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="34" cy="20" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M16 23l12-6 3 5-12 6zM15 26l-2 14h5l1-13zM20 27l1 13h5l-2-14zM27 18l2-5 3 1-2 5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <BarbellGlyph :y="14.5" :plate-height="10" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
