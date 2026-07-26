<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M6 22h20a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6zM26 11h9a3 3 0 0 1 3 3v22h-15V14a3 3 0 0 1 3-3z"
      fill="var(--app-icon-body, currentColor)"
    />
    <circle cx="31.5" cy="10" r="6.5" fill="var(--app-icon-support, var(--muted-foreground))" />
    <path
      d="M8 22c0-7.2 4.2-11.5 10-11.5S27 14.8 27 22z"
      fill="var(--app-icon-accent, var(--primary))"
    />
  </AppIconSvg>
</template>
