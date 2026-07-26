<script setup lang="ts">
/** Shared face disc for the mood scale -- only the mouth path varies per level. */
const { mouth } = defineProps<{
  /** Mouth path in the shared 48x48 grid. */
  mouth: string
}>()
</script>

<template>
  <g>
    <circle cx="24" cy="24" r="19" fill="var(--app-icon-accent, var(--primary))" />
    <g fill="var(--app-icon-inverse, var(--background))">
      <circle cx="17.5" cy="20" r="2.6" />
      <circle cx="30.5" cy="20" r="2.6" />
    </g>
    <path
      :d="mouth"
      fill="none"
      stroke="var(--app-icon-inverse, var(--background))"
      stroke-width="3"
      stroke-linecap="round"
    />
  </g>
</template>
