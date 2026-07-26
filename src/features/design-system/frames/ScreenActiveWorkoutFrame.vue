<script setup lang="ts">
/**
 * The screen the whole app exists for: logging a set. Everything here is sized
 * for a thumb — if a change makes this screen slower, it is the wrong change.
 */
import { Check, ChevronLeft, Timer } from '@lucide/vue'
import { BLOCK_META } from '@/blocks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const sets = [
  { index: 1, previous: '80 × 8', weight: '80', reps: '8', done: true },
  { index: 2, previous: '80 × 8', weight: '80', reps: '8', done: true },
  { index: 3, previous: '80 × 7', weight: '80', reps: '7', done: false },
  { index: 4, previous: '80 × 6', weight: '80', reps: '—', done: false },
] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="flex h-[780px] flex-col bg-background">
    <header class="shrink-0 border-b bg-background/95 px-3 py-3 backdrop-blur">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Back">
          <ChevronLeft class="icon-lg" />
        </Button>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold">Push Day A</p>
          <p class="text-xs text-muted-foreground tabular-nums">24:18 elapsed · block 3 of 5</p>
        </div>
        <Badge variant="outline" class="tabular-nums">3/5</Badge>
      </div>
      <Progress :model-value="60" class="mt-2" />
    </header>

    <div class="min-h-0 flex-1 space-y-4 overflow-hidden p-3">
      <div class="flex items-center gap-2">
        <span
          class="rounded-md px-2 py-0.5 text-xs font-semibold"
          :class="[BLOCK_META.strength.color.bg, BLOCK_META.strength.color.text]"
        >
          {{ BLOCK_META.strength.label }}
        </span>
        <p class="truncate text-section-title font-semibold">Barbell Bench Press</p>
      </div>

      <Card class="gap-0 p-0">
        <div
          class="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-2 border-b px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          <span>Set</span>
          <span>Prev</span>
          <span>kg</span>
          <span>Reps</span>
          <span />
        </div>
        <div
          v-for="set in sets"
          :key="set.index"
          class="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] items-center gap-2 border-b px-3 py-2 last:border-0"
          :class="set.done ? 'bg-success/5' : ''"
        >
          <span class="text-sm font-medium tabular-nums">{{ set.index }}</span>
          <span class="text-sm text-muted-foreground tabular-nums">{{ set.previous }}</span>
          <span class="rounded-md bg-muted/60 px-2 py-1 text-sm font-medium tabular-nums">
            {{ set.weight }}
          </span>
          <span class="rounded-md bg-muted/60 px-2 py-1 text-sm font-medium tabular-nums">
            {{ set.reps }}
          </span>
          <span
            class="flex size-8 items-center justify-center rounded-md border"
            :class="set.done ? 'border-success bg-success text-success-foreground' : ''"
          >
            <Check class="icon-sm" />
          </span>
        </div>
      </Card>

      <div class="flex items-center gap-2 rounded-lg border border-dashed p-3">
        <Timer class="icon-md text-muted-foreground" />
        <p class="flex-1 text-sm text-muted-foreground">Rest</p>
        <p class="text-lg font-bold tabular-nums">01:59</p>
      </div>
    </div>

    <div class="shrink-0 border-t bg-card p-3">
      <Button class="h-touch w-full text-base">Log set 3</Button>
    </div>
  </div>
</template>
