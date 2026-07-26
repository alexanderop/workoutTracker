<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
import TorsoGlyph from '../TorsoGlyph.vue'
</script>

<template>
  <AppIconSvg>
    <TorsoGlyph />
    <path
      d="M16.6 18.5 16 26.5l6.8 11 .4-15.6zm14.8 0 .6 8-6.8 11-.4-15.6z"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <path d="M23 17h2v20h-2z" fill="var(--app-icon-support, var(--muted-foreground))" />
  </AppIconSvg>
</template>
