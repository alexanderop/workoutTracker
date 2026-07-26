<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect x="6" y="26" width="24" height="8" rx="2" fill="var(--app-icon-body, currentColor)" />
    <rect x="32" y="26" width="8" height="8" rx="2" fill="var(--app-icon-accent, var(--primary))" />
    <path
      d="M28 6c3.5 2.5 3.5 5.5 0 8s-3.5 5.5 0 8"
      fill="none"
      stroke="var(--app-icon-support, var(--muted-foreground))"
      stroke-width="3"
      stroke-linecap="round"
    />
    <rect
      x="2"
      y="27"
      width="44"
      height="6"
      rx="3"
      transform="rotate(-38 24 30)"
      fill="var(--app-icon-inverse, var(--background))"
    />
    <rect
      x="4"
      y="28.5"
      width="40"
      height="3"
      rx="1.5"
      transform="rotate(-38 24 30)"
      fill="var(--app-icon-accent, var(--primary))"
    />
  </AppIconSvg>
</template>
