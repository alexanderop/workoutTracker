<script setup lang="ts">
/**
 * The empty case, at full screen size — worth an artboard of its own because
 * an empty state is judged by how much of the screen it has to hold, not by
 * how the component looks in isolation.
 */
import { CalendarDays } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import DeviceChrome from '../components/DeviceChrome.vue'

const filters = ['All', 'This month', 'Strength', 'Cardio'] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <DeviceChrome active="workouts">
    <div class="flex h-full flex-col">
      <header class="shrink-0 space-y-3 p-4">
        <h1 class="text-page-title font-bold">History</h1>
        <div class="flex gap-2 overflow-hidden">
          <span
            v-for="(filter, index) in filters"
            :key="filter"
            class="filter-pill"
            :class="index === 1 ? 'filter-pill-active' : 'filter-pill-inactive'"
          >
            {{ filter }}
          </span>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Nothing in July yet</EmptyTitle>
            <EmptyDescription>
              Sessions you finish show up here with their volume and personal records.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Start a workout</Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  </DeviceChrome>
</template>
