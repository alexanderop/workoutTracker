<script setup lang="ts">
/**
 * Badges plus the two chip patterns defined as CSS components in style.css —
 * `.filter-pill` (exercise filters) and the `.status-*` classes (set outcomes).
 */
import { Flame, TrendingUp } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import type { BadgeVariants } from '@/components/ui/badge'

const variants: ReadonlyArray<NonNullable<BadgeVariants['variant']>> = [
  'default',
  'secondary',
  'outline',
  'destructive',
]

const filters = ['All', 'Chest', 'Back', 'Legs'] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Badge variants</h3>
      <div class="flex flex-wrap items-center gap-2">
        <Badge v-for="variant in variants" :key="variant" :variant="variant">
          {{ variant }}
        </Badge>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">With icons</h3>
      <div class="flex flex-wrap items-center gap-2">
        <Badge>
          <Flame />
          12 day streak
        </Badge>
        <Badge variant="secondary">
          <TrendingUp />
          +5 kg
        </Badge>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Filter pills</h3>
      <p class="text-xs text-muted-foreground">
        <code>.filter-pill</code> — horizontal scroller above exercise lists.
      </p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(filter, index) in filters"
          :key="filter"
          class="filter-pill"
          :class="index === 0 ? 'filter-pill-active' : 'filter-pill-inactive'"
        >
          {{ filter }}
        </span>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Status chips</h3>
      <p class="text-xs text-muted-foreground">
        Outcome colouring, tinted from the status token at 20%.
      </p>
      <div class="flex flex-wrap gap-2">
        <span class="status-success-bg rounded-full px-2 py-0.5 text-xs font-medium">
          Beat last time
        </span>
        <span class="status-warning-bg rounded-full px-2 py-0.5 text-xs font-medium">
          Missed target
        </span>
      </div>
    </section>
  </div>
</template>
