<script setup lang="ts">
/**
 * Home, at device width. Composed from the same Card/Badge/Button/Progress the
 * app ships — the value of a screen artboard is seeing whether the components
 * still hold together once there are twelve of them on one 390px column.
 */
import { ChevronRight, Dumbbell, Flame, Plus } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import DeviceChrome from '../components/DeviceChrome.vue'

const stats = [
  { label: 'This week', value: '3' },
  { label: 'Volume', value: '31.2t' },
  { label: 'Streak', value: '12d' },
] as const

const recent = [
  { name: 'Push Day A', meta: 'Yesterday · 58 min' },
  { name: 'Leg Day', meta: 'Saturday · 42 min' },
] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <DeviceChrome active="home">
    <div class="space-y-section p-4">
      <header class="flex items-start justify-between">
        <div>
          <h1 class="text-page-title font-bold">Good day!</h1>
          <p class="text-sm text-muted-foreground">Monday, 26 July</p>
        </div>
        <Badge variant="secondary">
          <Flame class="text-highlight" />
          12
        </Badge>
      </header>

      <div class="grid grid-cols-3 gap-2">
        <Card v-for="stat in stats" :key="stat.label" class="gap-1 p-3">
          <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
          <p class="text-lg font-bold tabular-nums">{{ stat.value }}</p>
        </Card>
      </div>

      <Card class="gap-3 p-4">
        <div class="flex items-baseline justify-between">
          <p class="text-section-title font-semibold">Weekly goal</p>
          <p class="text-sm font-medium tabular-nums">3 / 4</p>
        </div>
        <Progress :model-value="75" />
        <p class="text-xs text-muted-foreground">One session left to hit the target.</p>
      </Card>

      <Button class="h-touch w-full text-base">
        <Plus />
        Start workout
      </Button>

      <section class="space-y-2">
        <h2 class="text-section-title font-semibold">Recent</h2>
        <Card v-for="workout in recent" :key="workout.name" class="p-0">
          <button type="button" class="flex w-full items-center gap-3 p-3 text-left">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
            >
              <Dumbbell class="icon-md text-primary" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ workout.name }}</span>
              <span class="block truncate text-sm text-muted-foreground">{{ workout.meta }}</span>
            </span>
            <ChevronRight class="icon-md shrink-0 text-muted-foreground" />
          </button>
        </Card>
      </section>
    </div>
  </DeviceChrome>
</template>
