<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M17 9h14l8 15-8 15H17L9 24z"
      fill="none"
      stroke="var(--app-icon-accent, var(--primary))"
      stroke-width="3.5"
      stroke-linejoin="round"
    />
    <g fill="var(--app-icon-body, currentColor)">
      <rect x="12" y="17" width="3.5" height="14" rx="1.75" />
      <rect x="32.5" y="17" width="3.5" height="14" rx="1.75" />
    </g>
  </AppIconSvg>
</template>
