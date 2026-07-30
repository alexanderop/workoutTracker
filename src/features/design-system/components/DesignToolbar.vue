<script setup lang="ts">
import { ChevronLeft, Maximize2, Minus, Moon, Plus, Sun } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const { zoomLabel, isDark } = defineProps<{
  zoomLabel: string
  isDark: boolean
}>()

const emit = defineEmits<{
  back: []
  'zoom-in': []
  'zoom-out': []
  fit: []
  'reset-zoom': []
  'toggle-theme': []
}>()
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design tooling chrome, not product copy -->
  <header class="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-2">
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Leave the design studio"
      @click="emit('back')"
    >
      <ChevronLeft class="icon-md" />
    </Button>

    <div class="flex min-w-0 items-baseline gap-2">
      <span class="truncate text-sm font-semibold">Design system</span>
      <span class="hidden truncate text-xs text-muted-foreground sm:inline">
        live components, real tokens
      </span>
    </div>

    <div class="ml-auto flex items-center gap-1">
      <div class="flex items-center rounded-md bg-muted/60 p-0.5">
        <Button variant="ghost" size="icon-sm" aria-label="Zoom out" @click="emit('zoom-out')">
          <Minus class="icon-sm" />
        </Button>
        <button
          type="button"
          class="min-w-14 rounded px-1 text-xs font-medium tabular-nums text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Reset zoom to 100%"
          @click="emit('reset-zoom')"
        >
          {{ zoomLabel }}
        </button>
        <Button variant="ghost" size="icon-sm" aria-label="Zoom in" @click="emit('zoom-in')">
          <Plus class="icon-sm" />
        </Button>
      </div>

      <Button variant="ghost" size="icon-sm" aria-label="Fit canvas to screen" @click="emit('fit')">
        <Maximize2 class="icon-sm" />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <Button
        variant="ghost"
        size="icon-sm"
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="emit('toggle-theme')"
      >
        <Sun v-if="isDark" class="icon-md" />
        <Moon v-else class="icon-md" />
      </Button>
    </div>
  </header>
</template>
