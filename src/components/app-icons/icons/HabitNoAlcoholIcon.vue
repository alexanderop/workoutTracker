<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <path
      d="M10 5h28c0 12.5-6.2 19-14 19S10 17.5 10 5z"
      fill="var(--app-icon-body, currentColor)"
    />
    <rect
      x="21.5"
      y="23"
      width="5"
      height="15"
      rx="2"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <rect
      x="12"
      y="37"
      width="24"
      height="6"
      rx="3"
      fill="var(--app-icon-support, var(--muted-foreground))"
    />
    <rect
      x="2"
      y="23"
      width="44"
      height="6"
      rx="3"
      transform="rotate(-38 24 26)"
      fill="var(--app-icon-inverse, var(--background))"
    />
    <rect
      x="4"
      y="24.5"
      width="40"
      height="3"
      rx="1.5"
      transform="rotate(-38 24 26)"
      fill="var(--app-icon-accent, var(--primary))"
    />
  </AppIconSvg>
</template>
