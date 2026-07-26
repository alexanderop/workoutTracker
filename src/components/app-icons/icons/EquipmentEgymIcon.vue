<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect x="9" y="5" width="30" height="24" rx="3.5" fill="var(--app-icon-body, currentColor)" />
    <rect
      x="13"
      y="9"
      width="22"
      height="16"
      rx="2"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <path
      d="M17 16h3v6h-3zm5-4h3v10h-3zm5 6h3v4h-3z"
      fill="var(--app-icon-inverse, var(--background))"
    />
    <path
      d="M21.5 29h5v8h-5zM13 39h22v4H13z"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
  </AppIconSvg>
</template>
