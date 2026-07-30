<script setup lang="ts">
/**
 * `Card` and its slots, shown as the app actually composes them: a workout
 * summary, and the denser stat tile used on the home screen.
 */
import { ChevronRight, Dumbbell } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const stats = [
  { label: 'Volume', value: '12,480 kg' },
  { label: 'Sets', value: '24' },
  { label: 'Duration', value: '58 min' },
] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Full anatomy</h3>
      <Card>
        <CardHeader>
          <CardTitle>Push Day A</CardTitle>
          <CardDescription>Chest, shoulders, triceps · 5 blocks</CardDescription>
          <CardAction>
            <Badge variant="secondary">Template</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Bench Press · Overhead Press · Incline DB Press · Lateral Raise · Triceps Pushdown
          </p>
        </CardContent>
        <CardFooter class="gap-2">
          <Button class="flex-1">Start</Button>
          <Button variant="outline">Edit</Button>
        </CardFooter>
      </Card>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">List row</h3>
      <p class="text-xs text-muted-foreground">Tappable card, no footer — history and templates.</p>
      <Card class="p-0">
        <button type="button" class="flex w-full items-center gap-3 p-4 text-left">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Dumbbell class="icon-md text-primary" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium">Leg Day</span>
            <span class="block truncate text-sm text-muted-foreground">Yesterday · 42 min</span>
          </span>
          <ChevronRight class="icon-md shrink-0 text-muted-foreground" />
        </button>
      </Card>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Stat tiles</h3>
      <div class="grid grid-cols-3 gap-2">
        <Card v-for="stat in stats" :key="stat.label" class="gap-1 p-3">
          <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
          <p class="text-lg font-bold tabular-nums">{{ stat.value }}</p>
        </Card>
      </div>
    </section>
  </div>
</template>
