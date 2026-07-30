<script setup lang="ts">
/**
 * Radius, spacing rhythm, icon sizing and touch targets — the geometry tokens.
 * Radius chips are driven by `--radius`, so the theme lab's corner slider moves
 * every one of them at once.
 */
const radii = [
  { cls: 'rounded-sm', label: 'rounded-sm' },
  { cls: 'rounded-md', label: 'rounded-md' },
  { cls: 'rounded-lg', label: 'rounded-lg' },
  { cls: 'rounded-xl', label: 'rounded-xl' },
  { cls: 'rounded-full', label: 'rounded-full' },
] as const

const icons = [
  { cls: 'icon-sm', label: 'icon-sm', value: '1rem' },
  { cls: 'icon-md', label: 'icon-md', value: '1.25rem' },
  { cls: 'icon-lg', label: 'icon-lg', value: '1.5rem' },
] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Corner radius</h3>
      <p class="text-xs text-muted-foreground">All derived from <code>--radius</code>.</p>
      <div class="flex flex-wrap gap-3">
        <div v-for="radius in radii" :key="radius.label" class="space-y-1 text-center">
          <div class="size-14 border-2 border-primary/60 bg-primary/10" :class="radius.cls" />
          <code class="text-[10px] text-muted-foreground">{{ radius.label }}</code>
        </div>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Vertical rhythm</h3>
      <p class="text-xs text-muted-foreground">
        <code>space-y-section</code> (1.5rem) separates page sections.
      </p>
      <div class="space-y-section">
        <div class="h-8 rounded-md bg-muted" />
        <div class="h-8 rounded-md bg-muted" />
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Icon sizes</h3>
      <div class="flex items-end gap-5">
        <div v-for="icon in icons" :key="icon.label" class="space-y-1 text-center">
          <div class="mx-auto rounded-sm bg-foreground/70" :class="icon.cls" />
          <code class="block text-[10px] text-muted-foreground">{{ icon.label }}</code>
          <span class="text-[10px] text-muted-foreground/70">{{ icon.value }}</span>
        </div>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Touch targets</h3>
      <p class="text-xs text-muted-foreground">
        Anything tapped mid-set clears 44px — sweaty thumbs, moving phone.
      </p>
      <div class="flex items-center gap-3">
        <div
          class="touch-target flex min-w-24 items-center justify-center rounded-md border border-dashed border-primary/50 text-[11px] text-muted-foreground"
        >
          touch-target
        </div>
        <div
          class="h-touch flex min-w-24 items-center justify-center rounded-md border border-dashed border-primary/50 text-[11px] text-muted-foreground"
        >
          h-touch
        </div>
      </div>
    </section>
  </div>
</template>
