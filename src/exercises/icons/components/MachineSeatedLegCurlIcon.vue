<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M7 10h3v17H7zM8 26h13v3H8zM10 29h3v13h-3zM4 42h40v2H4z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="14" cy="9" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M12 12h5l1 14h-7zM12 23l14 1v4H12zM24 27l5-1 1 11h-4z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M16 19h7v4h-7zM25 37h8v4h-8z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
