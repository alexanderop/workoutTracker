<script setup lang="ts">
/**
 * The design studio: an infinite canvas of artboards, every one of them
 * rendering the app's real components against the app's real tokens.
 *
 * Deliberately desktop-shaped even though the product is mobile-first — this
 * is a design surface you open on a laptop to compare and brainstorm, not a
 * screen you use mid-set.
 */
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import DesignFrame from '../components/DesignFrame.vue'
import DesignLayersPanel from '../components/DesignLayersPanel.vue'
import DesignToolbar from '../components/DesignToolbar.vue'
import { useCanvasViewport } from '../composables/useCanvasViewport'
import { designSections } from '../catalog'

const router = useRouter()
const { isDark } = useTheme()

const canvasEl = useTemplateRef<HTMLElement>('canvasEl')
const worldEl = useTemplateRef<HTMLElement>('worldEl')

const {
  viewport,
  zoomLabel,
  cursor,
  zoomIn,
  zoomOut,
  fit,
  reset,
  revealPoint,
  onPointerDown,
  onPointerMove,
  onPointerUp,
} = useCanvasViewport(canvasEl, worldEl)

const selectedId = ref<string | null>(null)

const worldStyle = computed(() => ({
  transform: `translate3d(${viewport.value.x}px, ${viewport.value.y}px, 0) scale(${viewport.value.zoom})`,
  transformOrigin: '0 0',
}))

const canvasStyle = computed(() => {
  const gridSize = 24 * viewport.value.zoom
  return {
    cursor: cursor.value,
    backgroundImage:
      'radial-gradient(circle, oklch(from var(--foreground) l c h / 16%) 1px, transparent 1px)',
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${viewport.value.x}px ${viewport.value.y}px`,
  }
})

/** World-space top-left of a frame, derived from the DOM so CSS owns the layout. */
function frameOrigin(id: string): { x: number; y: number } | null {
  const world = worldEl.value
  const element = world?.querySelector(`[data-frame-id="${CSS.escape(id)}"]`)
  if (!world || !(element instanceof HTMLElement)) return null

  const { zoom } = viewport.value
  const frame = element.getBoundingClientRect()
  const origin = world.getBoundingClientRect()
  return {
    x: (frame.left - origin.left) / zoom,
    // The frame label sits above the artboard; back off so it stays in view.
    y: (frame.top - origin.top) / zoom - 8,
  }
}

function selectFrame(id: string): void {
  selectedId.value = id
}

/** Layers-panel picks also navigate; clicking the artboard itself only selects. */
function jumpToFrame(id: string): void {
  selectFrame(id)
  const origin = frameOrigin(id)
  if (origin) revealPoint(origin)
}
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design tooling chrome, not product copy -->
  <div class="flex h-screen flex-col overflow-hidden bg-background">
    <DesignToolbar
      :zoom-label="zoomLabel"
      :is-dark="isDark"
      @back="router.back()"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @fit="fit"
      @reset-zoom="reset"
      @toggle-theme="isDark = !isDark"
    />

    <div class="flex min-h-0 flex-1">
      <DesignLayersPanel
        class="hidden md:flex"
        :sections="designSections"
        :selected-id="selectedId"
        @select="jumpToFrame"
      />

      <div
        ref="canvasEl"
        class="relative min-w-0 flex-1 touch-none overflow-hidden bg-muted/40 select-none"
        :style="canvasStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          ref="worldEl"
          class="absolute top-0 left-0 flex items-start gap-14 p-14"
          :style="worldStyle"
        >
          <section
            v-for="section in designSections"
            :key="section.id"
            class="flex flex-col items-start gap-3"
          >
            <h2 class="text-lg font-semibold tracking-tight text-muted-foreground/80">
              {{ section.name }}
            </h2>
            <div class="flex flex-col items-start gap-10">
              <DesignFrame
                v-for="frame in section.frames"
                :key="frame.id"
                :spec="frame"
                :selected="frame.id === selectedId"
                @select="selectFrame"
              />
            </div>
          </section>
        </div>

        <p
          class="pointer-events-none absolute bottom-3 left-3 rounded-md bg-card/85 px-2 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur"
        >
          Scroll to pan · ⌘/Ctrl + scroll to zoom · drag empty space to move
        </p>
      </div>
    </div>
  </div>
</template>
