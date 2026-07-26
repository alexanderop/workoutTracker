<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <circle cx="29" cy="9" r="5" fill="var(--app-icon-body, currentColor)" />
    <path
      d="m25 15 7 2.5 8 7-3 3.4-6.5-5.6-3.5 6.7 6 5.5 3 14h-5.5l-2.5-11.5-9-8L23 17z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="m21.5 21.5 3.5 3.5-4 6.5-3 8.5-5-1.5 3.5-10z"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <path d="M6 21h11v4.5H6z" fill="var(--app-icon-support, var(--muted-foreground))" />
  </AppIconSvg>
</template>
