<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <circle cx="24" cy="10" r="6" fill="var(--app-icon-accent, var(--primary))" />
    <circle cx="24" cy="10" r="2" fill="var(--app-icon-inverse, var(--background))" />
    <path d="M22.5 16h3v15h-3z" fill="var(--app-icon-support, var(--muted-foreground))" />
    <rect
      x="13"
      y="30"
      width="22"
      height="4.5"
      rx="2.25"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <path
      d="M16 34.5h4V38a4 4 0 0 0 8 0v-3.5h4V38a8 8 0 0 1-16 0z"
      fill="var(--app-icon-body, currentColor)"
    />
  </AppIconSvg>
</template>
