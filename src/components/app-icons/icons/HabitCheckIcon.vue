<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <circle cx="24" cy="24" r="19" fill="var(--app-icon-accent, var(--primary))" />
    <path
      d="m21 33.5-9.5-9.5 4-4 5.5 5.5L33 14.5l4 4z"
      fill="var(--app-icon-inverse, var(--background))"
    />
  </AppIconSvg>
</template>
