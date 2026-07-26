<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect
      x="4"
      y="13"
      width="4.5"
      height="22"
      rx="2.25"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <path
      d="M8.5 22.5h27a8.5 8.5 0 0 1 8.5 8.5v4h-35.5z"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <rect
      x="11"
      y="16"
      width="11"
      height="6.5"
      rx="3.25"
      fill="var(--app-icon-body, currentColor)"
    />
    <path d="M4 35h40v4H4z" fill="var(--app-icon-support, var(--muted-foreground))" />
  </AppIconSvg>
</template>
