<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
import BarbellGlyph from '@/exercises/icons/BarbellGlyph.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="22" cy="7" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M20 11l-2 15h8l-1-15zM18 26l-8 6 3 4 7-6zM10 32l-1 8h5l1-6zM24 26l11 11-2 3-11-10z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M12 11l8 2v3l-8-2zm24 0-8 2v3l8-2z" fill="var(--exercise-icon-body, currentColor)" />
    <BarbellGlyph :x="2" :y="12.5" :width="38" :plate-height="10" />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
