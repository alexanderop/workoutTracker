<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M8 5h32v3.5H8zM8 5h3.5v38H8zM36.5 5H40v38h-3.5z"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <path d="M22.5 8.5h3V16h-3z" fill="var(--app-icon-body, currentColor)" />
    <g fill="var(--app-icon-accent, var(--primary))">
      <rect x="15" y="16" width="18" height="5" rx="1.5" />
      <rect x="15" y="23" width="18" height="5" rx="1.5" />
      <rect x="15" y="30" width="18" height="5" rx="1.5" />
    </g>
  </AppIconSvg>
</template>
