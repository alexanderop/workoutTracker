<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M12 24c3-8 6 8 9 0s6 8 9 0 6 8 9 0"
      fill="none"
      stroke="var(--app-icon-accent, var(--primary))"
      stroke-width="3.5"
      stroke-linecap="round"
    />
    <g fill="var(--app-icon-body, currentColor)">
      <rect x="4" y="18" width="7" height="12" rx="3.5" />
      <rect x="37" y="18" width="7" height="12" rx="3.5" />
    </g>
  </AppIconSvg>
</template>
