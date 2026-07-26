<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path d="M4 44 16 15l17 17z" fill="var(--app-icon-accent, var(--primary))" />
    <path d="M16 15 33 32l-9 3.5-13.5-13.5z" fill="var(--app-icon-body, currentColor)" />
    <g fill="var(--app-icon-support, var(--muted-foreground))">
      <circle cx="30" cy="7" r="3" />
      <circle cx="41" cy="15" r="2.5" />
      <circle cx="40" cy="4.5" r="2" />
      <circle cx="21" cy="6" r="2" />
      <circle cx="43" cy="27" r="2.5" />
    </g>
  </AppIconSvg>
</template>
