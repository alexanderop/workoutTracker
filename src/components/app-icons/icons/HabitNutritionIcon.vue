<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M24.5 24.5c-2.5-6.5.5-12.5 7-15.5 1.5 6.5-1 12.5-7 15.5z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M22 24.5c-4.5-4.5-10.5-5-16.5-2.5 4.5 4.5 10.5 6 16.5 2.5z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path d="M7 26h34a17 17 0 0 1-34 0z" fill="var(--app-icon-accent, var(--primary))" />
    <rect
      x="4"
      y="24"
      width="40"
      height="4"
      rx="2"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
  </AppIconSvg>
</template>
