<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <rect x="14" y="5" width="20" height="38" rx="5" fill="var(--app-icon-body, currentColor)" />
    <rect
      x="17.5"
      y="9.5"
      width="13"
      height="26"
      rx="2.5"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <rect
      x="20"
      y="37.5"
      width="8"
      height="3"
      rx="1.5"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <rect
      x="2"
      y="21"
      width="44"
      height="6"
      rx="3"
      transform="rotate(-38 24 24)"
      fill="var(--app-icon-inverse, var(--background))"
    />
    <rect
      x="4"
      y="22.5"
      width="40"
      height="3"
      rx="1.5"
      transform="rotate(-38 24 24)"
      fill="var(--app-icon-accent, var(--primary))"
    />
  </AppIconSvg>
</template>
