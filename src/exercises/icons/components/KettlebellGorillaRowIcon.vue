<script setup lang="ts">
import ExerciseIconSvg from '@/exercises/icons/ExerciseIconSvg.vue'
</script>

<template>
  <ExerciseIconSvg>
    <circle cx="13" cy="15" r="4" fill="var(--exercise-icon-body, currentColor)" />
    <path
      d="m16 16 11 4-1 5-12-4zM26 20l6 2-2 18h-5l3-16-2-1zm6 2 5-1 3 19h-5l-2-14z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <path
      d="m16 18-4 10 4 1 3-10zm2-2 5 3-2 7-4-2z"
      fill="var(--exercise-icon-body, currentColor)"
    />
    <g transform="translate(-17 15) scale(0.8)">
      <path
        d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
        fill="var(--exercise-icon-equipment, var(--primary))"
      />
    </g>
    <g transform="translate(-8 12) scale(0.8)">
      <path
        d="M36 16a6 6 0 0 0-6 6h3a3 3 0 0 1 6 0h3a6 6 0 0 0-6-6zM31 22h10v9a5 5 0 0 1-10 0z"
        fill="var(--exercise-icon-equipment, var(--primary))"
      />
    </g>
    <path d="M4 40h40v2H4z" fill="var(--exercise-icon-support, var(--muted-foreground))" />
  </ExerciseIconSvg>
</template>
