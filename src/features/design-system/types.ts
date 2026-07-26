import type { Component } from 'vue'

type DesignSectionId = 'foundations' | 'components' | 'patterns' | 'screens'

export type DesignControlValue = string | boolean

/**
 * A knob the inspector renders for the selected frame — the studio's answer to
 * Figma's variant properties, except it drives the real component's props.
 */
export type DesignControl =
  | {
      readonly kind: 'select'
      readonly key: string
      readonly label: string
      readonly options: ReadonlyArray<string>
      readonly initial: string
    }
  | {
      readonly kind: 'switch'
      readonly key: string
      readonly label: string
      readonly initial: boolean
    }
  | {
      readonly kind: 'text'
      readonly key: string
      readonly label: string
      readonly initial: string
    }

/** Current value of every control on one frame, keyed by control key. */
export type DesignControlState = Record<string, DesignControlValue>

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
  /**
   * Screen artboards render edge to edge — the frame's own padding would read
   * as a margin the app does not have. Defaults to padded.
   */
  readonly bleed?: boolean
  /**
   * Declaring controls makes the frame a playground: the inspector renders
   * them and the frame component receives the live values as `state`.
   */
  readonly controls?: ReadonlyArray<DesignControl>
}

export type DesignSection = {
  readonly id: DesignSectionId
  readonly name: string
  readonly frames: ReadonlyArray<DesignFrameSpec>
}
