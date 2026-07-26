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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RouteNames } from '@/router'
import DesignFrame from '../components/DesignFrame.vue'
import DesignInspectorPanel from '../components/DesignInspectorPanel.vue'
import DesignLayersPanel from '../components/DesignLayersPanel.vue'
import DesignThemeLab from '../components/DesignThemeLab.vue'
import DesignToolbar from '../components/DesignToolbar.vue'
import { useCanvasViewport } from '../composables/useCanvasViewport'
import { initialControlState } from '../lib/controls'
import {
  DEFAULT_DRAFT,
  isDefaultDraft,
  normalizeOklch,
  normalizeRadius,
  themeVariables,
} from '../lib/themeDraft'
import type { Oklch, ThemeDraft } from '../lib/themeDraft'
import { designSections } from '../catalog'
import type { DesignControlState, DesignControlValue } from '../types'

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

const allFrames = designSections.flatMap((section) => section.frames)

/**
 * Live control values, one bag per playground frame. Kept here rather than
 * inside each frame so the inspector and the artboard read and write the same
 * object — that is what makes the panel feel wired to the canvas.
 */
const controlStates = ref<Record<string, DesignControlState>>(
  Object.fromEntries(
    allFrames
      .filter((frame) => frame.controls)
      .map((frame) => [frame.id, initialControlState(frame.controls)]),
  ),
)

const selectedFrame = computed(
  () => allFrames.find((frame) => frame.id === selectedId.value) ?? null,
)

const selectedSectionName = computed(
  () =>
    designSections.find((section) => section.frames.some((frame) => frame.id === selectedId.value))
      ?.name ?? null,
)

const selectedState = computed(() =>
  selectedId.value === null ? null : (controlStates.value[selectedId.value] ?? null),
)

const panelTab = ref('inspect')
const themeDraft = ref<ThemeDraft>(DEFAULT_DRAFT)

/**
 * Only override once the draft has actually been edited. Applying the light
 * theme's defaults unconditionally would repaint dark mode with the wrong
 * primary the moment the studio opened.
 */
const themeStyle = computed(() =>
  isDefaultDraft(themeDraft.value) ? {} : themeVariables(themeDraft.value),
)

function setThemeRadius(radius: number): void {
  themeDraft.value = { ...themeDraft.value, radius: normalizeRadius(radius) }
}

function setThemePrimary(primary: Oklch): void {
  themeDraft.value = { ...themeDraft.value, primary: normalizeOklch(primary) }
}

function resetTheme(): void {
  themeDraft.value = DEFAULT_DRAFT
}

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

/**
 * Back normally means "undo the navigation that got me here", but the studio is
 * often opened straight from a bookmarked /design URL — and `router.back()`
 * with no app history to pop leaves the user stranded on the canvas.
 */
function goBack(): void {
  if (globalThis.history.state?.back) {
    router.back()
    return
  }
  router.push({ name: RouteNames.Settings })
}

function selectFrame(id: string): void {
  selectedId.value = id
}

function applyControl(key: string, value: DesignControlValue): void {
  const state = selectedState.value
  if (state) state[key] = value
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
  <div
    data-testid="design-studio"
    class="flex h-screen flex-col overflow-hidden bg-background"
    :style="themeStyle"
  >
    <DesignToolbar
      :zoom-label="zoomLabel"
      :is-dark="isDark"
      @back="goBack"
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
        data-testid="design-canvas"
        class="relative min-w-0 flex-1 touch-none overflow-hidden bg-muted/40 select-none"
        :style="canvasStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          ref="worldEl"
          data-testid="design-world"
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
                :state="controlStates[frame.id]"
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

      <aside class="hidden w-72 shrink-0 flex-col border-l bg-card lg:flex">
        <Tabs v-model="panelTab" class="flex min-h-0 flex-1 flex-col">
          <TabsList class="m-2 grid shrink-0 grid-cols-2">
            <TabsTrigger value="inspect">Inspect</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="inspect" class="min-h-0 flex-1 overflow-y-auto">
            <DesignInspectorPanel
              :frame="selectedFrame"
              :section-name="selectedSectionName"
              :state="selectedState"
              :frame-count="allFrames.length"
              @update-control="applyControl"
            />
          </TabsContent>

          <TabsContent value="theme" class="min-h-0 flex-1 overflow-y-auto">
            <DesignThemeLab
              :draft="themeDraft"
              :is-dark="isDark"
              @update-radius="setThemeRadius"
              @update-primary="setThemePrimary"
              @reset="resetTheme"
            />
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  </div>
</template>
