/**
 * A throwaway edit of the app's theme tokens.
 *
 * The point of the theme lab is that you can move one slider and watch every
 * frame on the canvas repaint — the same thing that makes the token discipline
 * in style.css worth having. Nothing here writes to disk: the output is a CSS
 * block you paste into src/style.css once you like what you see.
 *
 * Colors are oklch because that is what the app's tokens already use: lightness
 * is perceptually even, so dragging L does not silently wreck contrast the way
 * an HSL ramp does.
 */

export type Oklch = {
  readonly l: number
  readonly c: number
  readonly h: number
}

export type ThemeDraft = {
  /** `--radius` in rem. */
  readonly radius: number
  readonly primary: Oklch
}

/** Mirrors the `:root` values in src/style.css. */
export const DEFAULT_DRAFT: ThemeDraft = {
  radius: 0.625,
  primary: { l: 0.55, c: 0.25, h: 290 },
}

export const PRIMARY_PRESETS: ReadonlyArray<{ name: string; color: Oklch }> = [
  { name: 'Violet', color: { l: 0.55, c: 0.25, h: 290 } },
  { name: 'Indigo', color: { l: 0.54, c: 0.21, h: 265 } },
  { name: 'Ocean', color: { l: 0.58, c: 0.15, h: 220 } },
  { name: 'Forest', color: { l: 0.55, c: 0.16, h: 155 } },
  { name: 'Ember', color: { l: 0.62, c: 0.19, h: 40 } },
  { name: 'Crimson', color: { l: 0.55, c: 0.22, h: 15 } },
  { name: 'Graphite', color: { l: 0.45, c: 0.02, h: 260 } },
]

export const RADIUS_RANGE = { min: 0, max: 1.5, step: 0.125 } as const
export const LIGHTNESS_RANGE = { min: 0.3, max: 0.85, step: 0.01 } as const
export const CHROMA_RANGE = { min: 0, max: 0.32, step: 0.005 } as const
export const HUE_RANGE = { min: 0, max: 360, step: 1 } as const

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Slider steps land on values like 0.30500000000000005; round on the way in so
 * the readouts and the exported CSS stay legible.
 */
export function normalizeOklch({ l, c, h }: Oklch): Oklch {
  return { l: round(l, 3), c: round(c, 3), h: round(h, 1) }
}

export function normalizeRadius(radius: number): number {
  return round(radius, 3)
}

export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${round(l, 3)} ${round(c, 3)} ${round(h, 1)})`
}

/**
 * Foreground that sits on the primary fill. A flat threshold rather than a
 * contrast calculation: oklch lightness already tracks perceived lightness, so
 * "is this fill light or dark" is the only question worth asking.
 *
 * The cutoff sits below the break-even point, not on it. For a neutral fill the
 * two foregrounds tie at about L=0.60 (white gives ~3:1 there, which fails AA);
 * crossing to dark text early costs nothing on the dark side and rescues the
 * mid-light values a slider lands on constantly.
 */
export function primaryForeground(primary: Oklch): string {
  return primary.l > 0.57 ? 'oklch(0.15 0 0)' : 'oklch(0.985 0 0)'
}

/**
 * The CSS custom properties a draft overrides. Sidebar primary is included so
 * the app's chrome tracks the brand instead of stranding the old hue.
 */
export function themeVariables(draft: ThemeDraft): Record<string, string> {
  const primary = formatOklch(draft.primary)
  const foreground = primaryForeground(draft.primary)
  return {
    '--radius': `${round(draft.radius, 3)}rem`,
    '--primary': primary,
    '--primary-foreground': foreground,
    '--sidebar-primary': primary,
    '--sidebar-primary-foreground': foreground,
  }
}

/**
 * The draft as a paste-ready CSS block. Targets `.dark` when the draft was made
 * against the dark theme — pasting dark-tuned values into `:root` would repaint
 * light mode with colours that were never looked at.
 */
export function themeCss(draft: ThemeDraft, isDark: boolean): string {
  const selector = isDark ? '.dark' : ':root'
  const body = Object.entries(themeVariables(draft))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
  return `${selector} {\n${body}\n}`
}

export function isDefaultDraft(draft: ThemeDraft): boolean {
  return (
    draft.radius === DEFAULT_DRAFT.radius &&
    draft.primary.l === DEFAULT_DRAFT.primary.l &&
    draft.primary.c === DEFAULT_DRAFT.primary.c &&
    draft.primary.h === DEFAULT_DRAFT.primary.h
  )
}
