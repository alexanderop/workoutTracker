<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
import TorsoGlyph from '../TorsoGlyph.vue'
</script>

<template>
  <AppIconSvg>
    <TorsoGlyph />
    <path
      d="M20 13.2 19 25l-9-3 1-4.4a10 10 0 0 1 9-4.4zm8 0L29 25l9-3-1-4.4a10 10 0 0 0-9-4.4z"
      fill="var(--app-icon-accent, var(--primary))"
    />
  </AppIconSvg>
</template>
