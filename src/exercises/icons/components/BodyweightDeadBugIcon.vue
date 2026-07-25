<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="7" cy="32" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M11 31l14 1v5l-14 1zM12 17h4v15h-4zM25 20h4l2 12h-6zM29 20l11 2-1 4-10-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M4 38h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
