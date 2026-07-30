import { describe, expect, it } from 'vitest'
import {
  INITIAL_VIEWPORT,
  MAX_ZOOM,
  MIN_ZOOM,
  centerOn,
  clampZoom,
  fitToContent,
  fitToWidth,
  formatZoom,
  panBy,
  toWorld,
  zoomAt,
} from '@/features/design-system/lib/viewport'

describe('clampZoom', () => {
  it('holds the zoom inside the usable range', () => {
    expect(clampZoom(0.01)).toBe(MIN_ZOOM)
    expect(clampZoom(99)).toBe(MAX_ZOOM)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('falls back to 1 for non-finite input', () => {
    expect(clampZoom(NaN)).toBe(1)
    expect(clampZoom(Infinity)).toBe(1)
  })
})

describe('toWorld', () => {
  it('inverts the canvas transform', () => {
    const viewport = { x: 100, y: 50, zoom: 2 }
    expect(toWorld(viewport, { x: 300, y: 150 })).toEqual({ x: 100, y: 50 })
  })
})

describe('zoomAt', () => {
  it('keeps the anchored point pinned to the same content', () => {
    const anchor = { x: 400, y: 300 }
    const before = { x: 20, y: -60, zoom: 1 }
    const worldUnderCursor = toWorld(before, anchor)

    const after = zoomAt(before, 2.5, anchor)

    expect(after.zoom).toBe(2.5)
    expect(toWorld(after, anchor).x).toBeCloseTo(worldUnderCursor.x)
    expect(toWorld(after, anchor).y).toBeCloseTo(worldUnderCursor.y)
  })

  it('clamps the requested zoom while still pinning the anchor', () => {
    const anchor = { x: 200, y: 200 }
    const result = zoomAt({ x: 0, y: 0, zoom: 1 }, 500, anchor)

    expect(result.zoom).toBe(MAX_ZOOM)
    expect(toWorld(result, anchor)).toEqual(toWorld({ x: 0, y: 0, zoom: 1 }, anchor))
  })
})

describe('panBy', () => {
  it('shifts the origin without touching zoom', () => {
    expect(panBy({ x: 10, y: 10, zoom: 0.5 }, -30, 15)).toEqual({ x: -20, y: 25, zoom: 0.5 })
  })
})

describe('fitToContent', () => {
  it('scales oversized content down and centres it', () => {
    const result = fitToContent({ width: 2000, height: 1000 }, { width: 1000, height: 800 }, 50)

    // Width is the binding constraint: 900 available / 2000 content.
    expect(result.zoom).toBeCloseTo(0.45)
    expect(result.x).toBeCloseTo((1000 - 2000 * 0.45) / 2)
    expect(result.y).toBeCloseTo((800 - 1000 * 0.45) / 2)
  })

  it('never magnifies content that already fits', () => {
    const result = fitToContent({ width: 200, height: 100 }, { width: 1000, height: 800 })
    expect(result.zoom).toBe(1)
  })

  it('returns the identity viewport for unmeasured content', () => {
    expect(fitToContent({ width: 0, height: 0 }, { width: 800, height: 600 })).toEqual(
      INITIAL_VIEWPORT,
    )
  })
})

describe('fitToWidth', () => {
  it('scales to the available width and pins the top', () => {
    const result = fitToWidth({ width: 2400, height: 9000 }, { width: 1200, height: 800 }, 40)

    expect(result.zoom).toBeCloseTo((1200 - 80) / 2400)
    expect(result.y).toBe(20)
  })

  it('ignores the content height entirely', () => {
    const short = fitToWidth({ width: 2400, height: 100 }, { width: 1200, height: 800 }, 40)
    const tall = fitToWidth({ width: 2400, height: 100_000 }, { width: 1200, height: 800 }, 40)

    expect(short.zoom).toBe(tall.zoom)
  })

  it('never magnifies a narrow file', () => {
    expect(fitToWidth({ width: 300, height: 200 }, { width: 1200, height: 800 }).zoom).toBe(1)
  })
})

describe('centerOn', () => {
  it('puts the target rectangle in the middle of the canvas', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const canvas = { width: 1000, height: 600 }
    const target = { x: 200, y: 100, width: 400, height: 200 }

    const result = centerOn(viewport, target, canvas)

    // Screen position of the target's centre must land on the canvas centre.
    expect(result.x + (target.x + target.width / 2) * result.zoom).toBe(canvas.width / 2)
    expect(result.y + (target.y + target.height / 2) * result.zoom).toBe(canvas.height / 2)
  })
})

describe('formatZoom', () => {
  it('labels zoom the way design tools do', () => {
    expect(formatZoom(1)).toBe('100%')
    expect(formatZoom(0.457)).toBe('46%')
  })
})
