<script setup lang="ts">
import ExerciseIconSvg from '../ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="24" cy="18" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m21 22 6-1 3 15H19zM19 32l-8 1v4l8 1zM13 35l-3 7h4l3-6z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m20 23-3-10 4-1 3 11zm8 0 3-10-4-1-3 11z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="M40 3h2v39h-2zM33 3h9v4h-9zM17 10h16v3H17zM35 4l3 3-7 6-3-3z"
      fill="var(--exercise-icon-equipment, var(--primary))"
    />
    <path
      d="M16 36h12v3H16zM20 39h4v3h-4zM6 42h36v2H6z"
      fill="var(--exercise-icon-support, var(--muted-foreground))"
    />
  </ExerciseIconSvg>
</template>
