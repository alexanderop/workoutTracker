<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect
      x="38.5"
      y="4.5"
      width="5.5"
      height="10"
      rx="2.5"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <path
      d="M39.8 6.7 24.8 14.7 27.2 19.3 42.2 11.3z"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <path
      d="M19 13h10l7.5 9H38a2.25 2.25 0 0 1 0 4.5H9a2.25 2.25 0 0 1 0-4.5h1.5z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M14 22.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"
      fill="var(--app-icon-inverse, var(--background))"
    />
    <g fill="var(--app-icon-accent, var(--primary))">
      <rect x="12.5" y="28.5" width="5" height="7.5" rx="2.5" />
      <rect x="21.5" y="28.5" width="5" height="7.5" rx="2.5" />
      <rect x="30.5" y="28.5" width="5" height="7.5" rx="2.5" />
      <rect x="17" y="37" width="5" height="7" rx="2.5" />
      <rect x="26" y="37" width="5" height="7" rx="2.5" />
    </g>
  </AppIconSvg>
</template>
