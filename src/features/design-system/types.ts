import type { Component } from 'vue'

type DesignSectionId = 'foundations' | 'components' | 'patterns' | 'screens'

/**
 * One artboard on the studio canvas.
 *
 * `width` is the frame's world-space width in CSS pixels — frames are laid out
 * at a fixed size like a design file, not fluidly like an app screen, so the
 * same composition reads identically at every zoom level.
 */
export type DesignFrameSpec = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly width: number
  readonly component: Component
  /** Design tokens or utility classes the frame demonstrates, shown in the inspector. */
  readonly tokens?: ReadonlyArray<string>
  /** Import path a developer would reach for to reuse this. */
  readonly source?: string
}

export type DesignSection = {
  readonly id: DesignSectionId
  readonly name: string
  readonly frames: ReadonlyArray<DesignFrameSpec>
}
