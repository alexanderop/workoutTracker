<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect
      x="5"
      y="41"
      width="38"
      height="3"
      rx="1.5"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <circle cx="23.5" cy="9" r="5" fill="var(--app-icon-body, currentColor)" />
    <path
      d="M19.25 15 L27.5 15 L28 26 L24.5 27 L19.75 38 L23.5 38.3 L23.5 41 L13.25 41 L14.25 37.5 L19.25 26 Z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M28 25.8 L32 37.6 L34 38 L34.5 41 L26.5 41 L27 37.6 L23 26.5 Z"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <path
      d="M27.63 17.24 L34.63 23.74 L31.37 27.26 L24.37 20.76 Z"
      fill="var(--app-icon-body, currentColor)"
    />
  </AppIconSvg>
</template>
