<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M5 10c6.5-3 12.5-2.5 18 2v27c-5.5-4.5-11.5-5-18-2z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M43 10c-6.5-3-12.5-2.5-18 2v27c5.5-4.5 11.5-5 18-2z"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <path d="M23 11h2v28h-2z" fill="var(--app-icon-support, var(--muted-foreground))" />
  </AppIconSvg>
</template>
