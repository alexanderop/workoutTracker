<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <g fill="var(--app-icon-body, currentColor)">
      <rect x="22" y="4" width="4" height="7" rx="2" />
      <rect x="22" y="4" width="4" height="7" rx="2" transform="rotate(45 24 21)" />
      <rect x="22" y="4" width="4" height="7" rx="2" transform="rotate(90 24 21)" />
      <rect x="22" y="4" width="4" height="7" rx="2" transform="rotate(135 24 21)" />
      <rect x="22" y="4" width="4" height="7" rx="2" transform="rotate(180 24 21)" />
      <rect x="22" y="4" width="4" height="7" rx="2" transform="rotate(225 24 21)" />
      <rect x="22" y="4" width="4" height="7" rx="2" transform="rotate(270 24 21)" />
      <rect x="22" y="4" width="4" height="7" rx="2" transform="rotate(315 24 21)" />
    </g>
    <circle cx="24" cy="21" r="8" fill="var(--app-icon-accent, var(--primary))" />
    <rect
      x="7"
      y="40"
      width="34"
      height="4"
      rx="2"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
  </AppIconSvg>
</template>
