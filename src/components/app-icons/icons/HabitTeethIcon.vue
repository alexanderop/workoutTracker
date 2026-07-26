<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect
      x="5"
      y="26"
      width="26"
      height="4.5"
      rx="2.25"
      transform="rotate(-35 24 24)"
      fill="var(--app-icon-body, currentColor)"
    />
    <rect
      x="29"
      y="24"
      width="14"
      height="6.5"
      rx="2"
      transform="rotate(-35 24 24)"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <rect
      x="30"
      y="17.5"
      width="13"
      height="6.5"
      rx="1.5"
      transform="rotate(-35 24 24)"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <path
      d="M33 17.5h2v5.5h-2zm5 0h2v5.5h-2z"
      transform="rotate(-35 24 24)"
      fill="var(--app-icon-inverse, var(--background))"
    />
  </AppIconSvg>
</template>
