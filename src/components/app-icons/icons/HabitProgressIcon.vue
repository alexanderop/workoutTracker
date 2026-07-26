<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect
      x="7"
      y="26"
      width="9"
      height="16"
      rx="2"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <rect x="19.5" y="16" width="9" height="26" rx="2" fill="var(--app-icon-body, currentColor)" />
    <rect x="32" y="6" width="9" height="36" rx="2" fill="var(--app-icon-accent, var(--primary))" />
  </AppIconSvg>
</template>
