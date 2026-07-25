<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <path
      d="M17 31h14v3H17zM21 34h6v6h-6zM6 40h36v2H6z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
    <circle cx="24" cy="8" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 13-2 15 2 3h6l2-3-2-15zM20 31l-2 9h4l2-9zm4 0 2 9h4l-2-9z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m21 14-13-5-1 4 13 5zm6 0 13-5 1 4-13 5z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path d="M6 6h4v9H6zM38 6h4v9h-4z" fill="var(--exercise-icon-equipment, var(--primary))" />
  </ExerciseIconSvg>
</template>
