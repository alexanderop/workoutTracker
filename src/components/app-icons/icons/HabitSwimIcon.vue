<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path d="M28 20.5 44 24.5l-1 5-16-4z" fill="var(--app-icon-support, var(--muted-foreground))" />
    <circle cx="14.5" cy="21" r="5.5" fill="var(--app-icon-body, currentColor)" />
    <path
      d="M18.5 15.5 29 16l11-5 2.5 3.5-9 5.5-4 5.5-11 1z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M21 16C20 6 11 4 6.5 12"
      fill="none"
      stroke="var(--app-icon-accent, var(--primary))"
      stroke-width="4.5"
      stroke-linecap="round"
    />
    <path
      d="M5 35q4.5-5 9 0t9 0 9 0 9 0"
      fill="none"
      stroke="var(--app-icon-support, var(--muted-foreground))"
      stroke-width="3.5"
      stroke-linecap="round"
    />
    <path
      d="M6 41q4.5-4 9 0t9 0 9 0 9 0"
      fill="none"
      stroke="var(--app-icon-support, var(--muted-foreground))"
      stroke-width="3.5"
      stroke-linecap="round"
    />
  </AppIconSvg>
</template>
