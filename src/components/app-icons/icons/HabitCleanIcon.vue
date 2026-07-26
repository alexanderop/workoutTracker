<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect x="21.5" y="4" width="5" height="22" rx="2.5" fill="var(--app-icon-body, currentColor)" />
    <path d="M17 26h14l2.5 6h-19z" fill="var(--app-icon-support, var(--muted-foreground))" />
    <path d="M14 32h20l3 12H11z" fill="var(--app-icon-accent, var(--primary))" />
    <path
      d="M19 33h2v11h-2zm4 0h2v11h-2zm4 0h2v11h-2z"
      fill="var(--app-icon-inverse, var(--background))"
    />
  </AppIconSvg>
</template>
