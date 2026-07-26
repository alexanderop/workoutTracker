<script setup lang="ts">
/**
 * Device shell for screen artboards: a fixed-height column with the app's
 * bottom navigation pinned underneath.
 *
 * The nav is a static stand-in for `Layout.vue`'s — the real one is bound to
 * the router, and a design surface has no route to be on. Everything above it
 * is the shipping components.
 */
import { Dumbbell, Home, ListChecks, Plus, Settings } from '@lucide/vue'

const { active } = defineProps<{
  active: 'home' | 'workouts' | 'habits' | 'settings'
}>()

defineSlots<{
  default: () => unknown
}>()

const left = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'workouts', icon: Dumbbell, label: 'Workouts' },
] as const

const right = [
  { id: 'habits', icon: ListChecks, label: 'Habits' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="flex h-[780px] flex-col bg-background">
    <div class="min-h-0 flex-1 overflow-hidden">
      <slot />
    </div>

    <nav class="shrink-0 border-t bg-card">
      <div class="flex items-center justify-around">
        <div
          v-for="item in left"
          :key="item.id"
          class="flex flex-1 flex-col items-center gap-1 py-2.5"
          :class="
            item.id === active ? 'border-t-2 border-primary text-primary' : 'text-muted-foreground'
          "
        >
          <component :is="item.icon" class="icon-md" />
          <span class="text-[10px]">{{ item.label }}</span>
        </div>

        <div class="flex flex-1 justify-center">
          <span
            class="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <Plus class="icon-lg" />
          </span>
        </div>

        <div
          v-for="item in right"
          :key="item.id"
          class="flex flex-1 flex-col items-center gap-1 py-2.5"
          :class="
            item.id === active ? 'border-t-2 border-primary text-primary' : 'text-muted-foreground'
          "
        >
          <component :is="item.icon" class="icon-md" />
          <span class="text-[10px]">{{ item.label }}</span>
        </div>
      </div>
    </nav>
  </div>
</template>
