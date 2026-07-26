<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M9 24h5.5l3.5-6 6 12 6-12 3.5 6H39"
      fill="none"
      stroke="var(--app-icon-accent, var(--primary))"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <g fill="var(--app-icon-accent, var(--primary))">
      <rect x="4" y="16" width="5" height="16" rx="2" />
      <rect x="39" y="16" width="5" height="16" rx="2" />
    </g>
  </AppIconSvg>
</template>
