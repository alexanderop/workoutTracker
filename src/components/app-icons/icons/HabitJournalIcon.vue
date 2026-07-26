<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path d="M7 4h18l7 7v18H7z" fill="var(--app-icon-body, currentColor)" />
    <path d="M25 4l7 7h-7z" fill="var(--app-icon-support, var(--muted-foreground))" />
    <path d="M12 14h13v3H12zm0 6h13v3H12z" fill="var(--app-icon-inverse, var(--background))" />
    <path d="M22 43h-6v-6l14-14 6 6z" fill="var(--app-icon-accent, var(--primary))" />
    <path
      d="m31.5 21.5 3-3a3 3 0 0 1 4.2 4.2l-3 3z"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
  </AppIconSvg>
</template>
