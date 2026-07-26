<script setup lang="ts">
/**
 * Every semantic color token in `src/style.css`, rendered live. The chips are
 * real utility classes, so anything that changes the token — theme switch,
 * theme lab tweak — repaints this frame with no extra wiring.
 */
type Swatch = { name: string; cls: string; note?: string }
type SwatchGroup = { title: string; hint: string; swatches: Array<Swatch> }

const groups: ReadonlyArray<SwatchGroup> = [
  {
    title: 'Surfaces',
    hint: 'Page and container backgrounds, darkest to lightest in dark mode.',
    swatches: [
      { name: 'background', cls: 'bg-background' },
      { name: 'card', cls: 'bg-card' },
      { name: 'popover', cls: 'bg-popover' },
      { name: 'muted', cls: 'bg-muted' },
      { name: 'accent', cls: 'bg-accent' },
      { name: 'secondary', cls: 'bg-secondary' },
    ],
  },
  {
    title: 'Brand',
    hint: 'Primary drives every affordance the user is meant to press.',
    swatches: [
      { name: 'primary', cls: 'bg-primary' },
      { name: 'primary-foreground', cls: 'bg-primary-foreground' },
      { name: 'ring', cls: 'bg-ring', note: 'focus' },
      { name: 'border', cls: 'bg-border' },
      { name: 'input', cls: 'bg-input' },
      { name: 'highlight', cls: 'bg-highlight', note: 'streaks' },
    ],
  },
  {
    title: 'Status',
    hint: 'Reserved for outcomes — never for decoration.',
    swatches: [
      { name: 'success', cls: 'bg-success' },
      { name: 'warning', cls: 'bg-warning' },
      { name: 'destructive', cls: 'bg-destructive' },
    ],
  },
  {
    title: 'Block kinds',
    hint: 'One accent per workout block type — see src/blocks/<kind>/meta.ts.',
    swatches: [
      { name: 'block-strength', cls: 'bg-block-strength' },
      { name: 'block-amrap', cls: 'bg-block-amrap' },
      { name: 'block-emom', cls: 'bg-block-emom' },
      { name: 'block-tabata', cls: 'bg-block-tabata' },
      { name: 'block-fortime', cls: 'bg-block-fortime' },
      { name: 'block-cardio', cls: 'bg-block-cardio' },
    ],
  },
  {
    title: 'Muscle groups',
    hint: 'Anatomy coding across exercise lists and filters.',
    swatches: [
      { name: 'muscle-chest', cls: 'bg-muscle-chest' },
      { name: 'muscle-back', cls: 'bg-muscle-back' },
      { name: 'muscle-legs', cls: 'bg-muscle-legs' },
      { name: 'muscle-shoulders', cls: 'bg-muscle-shoulders' },
      { name: 'muscle-arms', cls: 'bg-muscle-arms' },
      { name: 'muscle-core', cls: 'bg-muscle-core' },
    ],
  },
  {
    title: 'Charts',
    hint: 'Series colors, ordered for categorical use.',
    swatches: [
      { name: 'chart-1', cls: 'bg-chart-1' },
      { name: 'chart-2', cls: 'bg-chart-2' },
      { name: 'chart-3', cls: 'bg-chart-3' },
      { name: 'chart-4', cls: 'bg-chart-4' },
      { name: 'chart-5', cls: 'bg-chart-5' },
    ],
  },
]
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section v-for="group in groups" :key="group.title" class="space-y-2">
      <div>
        <h3 class="text-sm font-semibold">{{ group.title }}</h3>
        <p class="text-xs text-muted-foreground">{{ group.hint }}</p>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="swatch in group.swatches" :key="swatch.name" class="space-y-1">
          <div class="h-12 rounded-lg border" :class="swatch.cls" />
          <div class="flex items-baseline gap-1">
            <code class="truncate text-[11px] text-muted-foreground">{{ swatch.name }}</code>
            <span v-if="swatch.note" class="text-[10px] text-muted-foreground/70">
              {{ swatch.note }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
