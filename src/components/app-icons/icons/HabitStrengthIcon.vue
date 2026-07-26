<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <g fill="var(--app-icon-accent, var(--primary))">
      <rect x="7" y="8.5" width="34" height="3" rx="1.5" />
      <rect x="10" y="4" width="4.5" height="12" rx="2" />
      <rect x="33.5" y="4" width="4.5" height="12" rx="2" />
    </g>
    <g fill="var(--app-icon-body, currentColor)">
      <circle cx="24" cy="20.5" r="5" />
      <rect x="16.5" y="11.5" width="4" height="15" rx="1.5" />
      <rect x="27.5" y="11.5" width="4" height="15" rx="1.5" />
      <path d="M19 25h10v6H19z" />
      <path d="M19.8 31h3.4v12h-3.4zm5 0h3.4v12h-3.4z" />
    </g>
  </AppIconSvg>
</template>
