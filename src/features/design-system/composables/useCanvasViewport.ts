import { computed, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { useElementSize, useEventListener } from '@vueuse/core'
import type { Point, Viewport } from '../lib/viewport'
import {
  INITIAL_VIEWPORT,
  ZOOM_STEP,
  fitToContent,
  fitToWidth,
  formatZoom,
  panBy,
  zoomAt,
} from '../lib/viewport'

/** Elements that swallow the space bar for their own purposes. */
const TEXT_ENTRY = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return TEXT_ENTRY.has(target.tagName) || target.isContentEditable
}

/**
 * Canvas navigation for the design studio: wheel to pan, ⌘/Ctrl+wheel or pinch
 * to zoom at the cursor, drag the background (or space-drag / middle-drag
 * anywhere) to pan.
 *
 * `canvasEl` is the clipping viewport; `worldEl` is the transformed content
 * whose measured size drives "fit".
 */
export function useCanvasViewport(
  canvasEl: Readonly<Ref<HTMLElement | null>>,
  worldEl: Readonly<Ref<HTMLElement | null>>,
) {
  const viewport = shallowRef<Viewport>(INITIAL_VIEWPORT)
  const isPanning = ref(false)
  const isSpaceHeld = ref(false)

  const canvasSize = useElementSize(canvasEl)
  // Measured at zoom 1 via the wrapper's untransformed layout box, so "fit"
  // stays stable no matter what the current zoom is.
  const worldSize = useElementSize(worldEl, undefined, { box: 'border-box' })

  const zoomLabel = computed(() => formatZoom(viewport.value.zoom))
  const cursor = computed(() => {
    if (isPanning.value) return 'grabbing'
    return isSpaceHeld.value ? 'grab' : 'default'
  })

  function canvasCenter(): Point {
    return { x: canvasSize.width.value / 2, y: canvasSize.height.value / 2 }
  }

  function zoomBy(factor: number, anchor: Point = canvasCenter()): void {
    viewport.value = zoomAt(viewport.value, viewport.value.zoom * factor, anchor)
  }

  function zoomIn(): void {
    zoomBy(ZOOM_STEP)
  }

  function zoomOut(): void {
    zoomBy(1 / ZOOM_STEP)
  }

  function fit(): void {
    viewport.value = fitToContent(
      { width: worldSize.width.value, height: worldSize.height.value },
      { width: canvasSize.width.value, height: canvasSize.height.value },
    )
  }

  /**
   * Bring a world-space point into view without changing zoom. Left-biased
   * rather than centred: frames are read top-down, so pinning the top-left
   * corner keeps the frame label and first row visible.
   */
  function revealPoint(point: Point): void {
    const { zoom } = viewport.value
    const margin = 64
    viewport.value = {
      zoom,
      x: margin - point.x * zoom,
      y: margin - point.y * zoom,
    }
  }

  function reset(): void {
    viewport.value = INITIAL_VIEWPORT
  }

  // The world has no size until layout runs, so mounting is too early to fit —
  // the first real measurement is the earliest point it means anything. Fires
  // once: after that the viewport belongs to whoever is driving it.
  const stopAutoFit = watch([worldSize.width, canvasSize.width], ([world, canvas]) => {
    if (world <= 0 || canvas <= 0) return
    viewport.value = fitToWidth(
      { width: worldSize.width.value, height: worldSize.height.value },
      { width: canvasSize.width.value, height: canvasSize.height.value },
    )
    stopAutoFit()
  })

  // --- Wheel: pan by default, zoom with the modifier (or trackpad pinch,
  // which browsers report as a ctrl-wheel).
  useEventListener(
    canvasEl,
    'wheel',
    (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvasEl.value?.getBoundingClientRect()
      if (!rect) return

      if (event.ctrlKey || event.metaKey) {
        const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        // 0.002 keeps a trackpad pinch smooth without a mouse wheel feeling sluggish.
        viewport.value = zoomAt(
          viewport.value,
          viewport.value.zoom * Math.exp(-event.deltaY * 0.002),
          anchor,
        )
        return
      }

      viewport.value = panBy(viewport.value, -event.deltaX, -event.deltaY)
    },
    { passive: false },
  )

  // --- Drag panning
  let pointerId: number | null = null
  let last: Point = { x: 0, y: 0 }

  function onPointerDown(event: PointerEvent): void {
    const surface = event.currentTarget
    if (!(surface instanceof HTMLElement)) return

    const origin = event.target
    const startedInsideFrame =
      origin instanceof Element && origin.closest('[data-design-frame]') !== null

    const isMiddleDrag = event.button === 1
    const isBackgroundDrag = event.button === 0 && (isSpaceHeld.value || !startedInsideFrame)
    if (!isMiddleDrag && !isBackgroundDrag) return

    pointerId = event.pointerId
    last = { x: event.clientX, y: event.clientY }
    isPanning.value = true
    surface.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function onPointerMove(event: PointerEvent): void {
    if (pointerId !== event.pointerId || !isPanning.value) return
    viewport.value = panBy(viewport.value, event.clientX - last.x, event.clientY - last.y)
    last = { x: event.clientX, y: event.clientY }
  }

  function onPointerUp(event: PointerEvent): void {
    if (pointerId !== event.pointerId) return
    isPanning.value = false
    pointerId = null

    const surface = event.currentTarget
    if (surface instanceof HTMLElement && surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId)
    }
  }

  // --- Space-to-pan
  useEventListener(globalThis, 'keydown', (event: KeyboardEvent) => {
    if (event.code !== 'Space' || isTextEntry(event.target)) return
    isSpaceHeld.value = true
    event.preventDefault()
  })

  useEventListener(globalThis, 'keyup', (event: KeyboardEvent) => {
    if (event.code !== 'Space') return
    isSpaceHeld.value = false
  })

  // Held keys stick when the tab loses focus mid-drag otherwise.
  useEventListener(globalThis, 'blur', () => {
    isSpaceHeld.value = false
    isPanning.value = false
  })

  return {
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
  }
}
