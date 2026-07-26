<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M17.5 10H11A6.5 6.5 0 0 0 11 23H17.5Z"
      transform="rotate(-40 17.5 16.5)"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M17.5 23H24A6.5 6.5 0 0 0 24 10H17.5Z"
      transform="rotate(-40 17.5 16.5)"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <circle cx="11" cy="37.5" r="6" fill="var(--app-icon-support, var(--muted-foreground))" />
    <circle cx="34" cy="33.5" r="10.5" fill="var(--app-icon-body, currentColor)" />
    <rect
      x="32.25"
      y="25"
      width="3.5"
      height="17"
      rx="1.75"
      fill="var(--app-icon-inverse, var(--background))"
    />
  </AppIconSvg>
</template>
