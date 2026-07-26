<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect
      x="6"
      y="40.5"
      width="36"
      height="3.5"
      rx="1.75"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <g fill="none" stroke="var(--app-icon-body, currentColor)" stroke-width="4">
      <circle cx="13" cy="30.5" r="7" />
      <circle cx="35" cy="30.5" r="7" />
    </g>
    <path
      d="M20.2 11 24 30.5H13l8-15.5h12l-9 15.5M33 15l2 15.5"
      fill="none"
      stroke="var(--app-icon-accent, var(--primary))"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <rect x="15" y="7" width="11" height="4.5" rx="2.2" fill="var(--app-icon-body, currentColor)" />
    <path
      d="M33 15l-.7-5.5H36a3 3 0 0 1 3 3V15"
      fill="none"
      stroke="var(--app-icon-body, currentColor)"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </AppIconSvg>
</template>
