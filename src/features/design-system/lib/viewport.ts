/**
 * Pure viewport math for the design studio canvas.
 *
 * Kept free of Vue so the pan/zoom rules (the part that is easy to get subtly
 * wrong) are covered by the fast `unit` tier instead of a browser test.
 *
 * The canvas is a single `translate(x, y) scale(zoom)` transform applied to a
 * "world" element. Screen coordinates are relative to the canvas viewport's
 * top-left corner; world coordinates are the untransformed layout positions.
 */

export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 3

/** Multiplier applied per zoom-button press. */
export const ZOOM_STEP = 1.2

export type Viewport = {
  /** Horizontal screen offset of the world origin, in CSS pixels. */
  readonly x: number
  /** Vertical screen offset of the world origin, in CSS pixels. */
  readonly y: number
  readonly zoom: number
}

export type Size = {
  readonly width: number
  readonly height: number
}

export type Point = {
  readonly x: number
  readonly y: number
}

export const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

/** Screen point -> world point under the current transform. */
export function toWorld(viewport: Viewport, screen: Point): Point {
  return {
    x: (screen.x - viewport.x) / viewport.zoom,
    y: (screen.y - viewport.y) / viewport.zoom,
  }
}

/**
 * Zoom while keeping `anchor` (a screen point, typically the cursor) pinned to
 * the same world position — the behaviour every canvas editor uses.
 */
export function zoomAt(viewport: Viewport, nextZoom: number, anchor: Point): Viewport {
  const zoom = clampZoom(nextZoom)
  const world = toWorld(viewport, anchor)
  return {
    zoom,
    x: anchor.x - world.x * zoom,
    y: anchor.y - world.y * zoom,
  }
}

export function panBy(viewport: Viewport, deltaX: number, deltaY: number): Viewport {
  return { ...viewport, x: viewport.x + deltaX, y: viewport.y + deltaY }
}

/**
 * Scale `content` down to fit inside `canvas` with `padding` of breathing room,
 * then centre it. Never zooms past 1: a small file should sit at actual size
 * rather than being blown up.
 */
export function fitToContent(content: Size, canvas: Size, padding = 48): Viewport {
  const availableWidth = Math.max(1, canvas.width - padding * 2)
  const availableHeight = Math.max(1, canvas.height - padding * 2)
  if (content.width <= 0 || content.height <= 0) return INITIAL_VIEWPORT

  const zoom = clampZoom(
    Math.min(1, availableWidth / content.width, availableHeight / content.height),
  )
  return {
    zoom,
    x: (canvas.width - content.width * zoom) / 2,
    y: (canvas.height - content.height * zoom) / 2,
  }
}

/**
 * Fit the content's *width* and pin it to the top — the opening view of the
 * file. Fitting both axes is useless here because one tall column of frames
 * would shrink everything to an unreadable sliver; a designer opening a file
 * wants every column in view, read from the top down.
 */
export function fitToWidth(content: Size, canvas: Size, padding = 48): Viewport {
  if (content.width <= 0) return INITIAL_VIEWPORT

  const zoom = clampZoom(Math.min(1, Math.max(1, canvas.width - padding * 2) / content.width))
  return {
    zoom,
    x: (canvas.width - content.width * zoom) / 2,
    y: padding / 2,
  }
}

/**
 * Centre a single world-space rectangle in the viewport, keeping the current
 * zoom. Used when picking a frame in the layers panel.
 */
export function centerOn(viewport: Viewport, target: Point & Size, canvas: Size): Viewport {
  return {
    ...viewport,
    x: canvas.width / 2 - (target.x + target.width / 2) * viewport.zoom,
    y: canvas.height / 2 - (target.y + target.height / 2) * viewport.zoom,
  }
}

/** Format a zoom factor the way design tools label it: `120%`. */
export function formatZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`
}
