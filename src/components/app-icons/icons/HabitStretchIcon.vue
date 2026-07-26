<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect
      x="5"
      y="40"
      width="38"
      height="4"
      rx="2"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <rect
      x="12"
      y="33.5"
      width="28"
      height="6.5"
      rx="3.25"
      fill="var(--app-icon-body, currentColor)"
    />
    <rect x="34.5" y="24" width="6" height="11" rx="3" fill="var(--app-icon-body, currentColor)" />
    <path
      d="M17.86 36.93 12.14 34.07 21.14 16.07 26.86 18.93z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M26.55 18.61 37.05 26.41 33.95 30.59 23.45 22.79z"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <circle cx="27" cy="14.5" r="5" fill="var(--app-icon-body, currentColor)" />
  </AppIconSvg>
</template>
