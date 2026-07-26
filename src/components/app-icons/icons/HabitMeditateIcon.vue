<script setup lang="ts">
import AppIconSvg from '../AppIconSvg.vue'
</script>

<template>
  <AppIconSvg>
    <circle cx="24" cy="10" r="5.5" fill="var(--app-icon-body, currentColor)" />
    <path
      d="M24 17.5c5 0 8.5 4 8.5 9.5l-3 2.5h-11L15.5 27c0-5.5 3.5-9.5 8.5-9.5z"
      fill="var(--app-icon-body, currentColor)"
    />
    <path
      d="M12 30h24a4.5 4.5 0 0 1-4.5 7h-15A4.5 4.5 0 0 1 12 30z"
      fill="var(--app-icon-accent, var(--primary))"
    />
    <g fill="var(--app-icon-support, var(--muted-foreground))">
      <path d="M6.5 25h7l1.5 5H7z" />
      <path d="M41.5 25h-7L33 30h8z" />
    </g>
  </AppIconSvg>
</template>
