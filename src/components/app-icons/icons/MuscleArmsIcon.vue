<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <g fill="var(--app-icon-body, currentColor)">
      <rect x="4" y="23" width="34" height="13" rx="6.5" />
      <rect x="25" y="6" width="13" height="26" rx="6.5" />
    </g>
    <path
      d="M9 23c0-7.5 4.7-12 10.5-12S30 15.5 30 23z"
      fill="var(--app-icon-accent, var(--primary))"
    />
  </AppIconSvg>
</template>
