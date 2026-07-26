<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <circle cx="24" cy="9" r="5" fill="var(--app-icon-body, currentColor)" />
    <path
      d="M21.5 16h5l8.5 9-3 2.8-5-5.3V29h-6v-6.5l-5 5.3-3-2.8z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M19.5 30h9l4.5 13-3.8 1.3L24 34.5l-5.2 9.8L15 43z"
      fill="var(--app-icon-accent, var(--primary))"
    />
  </AppIconSvg>
</template>
