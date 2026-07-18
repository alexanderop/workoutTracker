<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M4 26h11v3H4zM6 29h2v11H6zm6 0h2v11h-2z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="7" cy="20" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="M11 23l13-3 3 5-13 4zM25 21l9 4-2 4-8-4zM34 27l-2 13h-5l3-13z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M21 18h9v2h-9zM19 15h3v8h-3zm9 0h3v8h-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
