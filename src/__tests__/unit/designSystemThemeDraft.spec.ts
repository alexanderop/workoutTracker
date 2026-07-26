import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DRAFT,
  formatOklch,
  isDefaultDraft,
  normalizeOklch,
  normalizeRadius,
  primaryForeground,
  themeCss,
  themeVariables,
} from '@/features/design-system/lib/themeDraft'

describe('formatOklch', () => {
  it('emits CSS oklch with the app tokens spacing', () => {
    expect(formatOklch({ l: 0.55, c: 0.25, h: 290 })).toBe('oklch(0.55 0.25 290)')
  })

  it('trims the float noise a slider step produces', () => {
    expect(formatOklch({ l: 0.30500000000000005, c: 0.1, h: 41.999999 })).toBe(
      'oklch(0.305 0.1 42)',
    )
  })
})

describe('normalizeOklch', () => {
  it('rounds each channel to the precision the readout shows', () => {
    expect(normalizeOklch({ l: 0.30500000000000005, c: 0.055000001, h: 289.96 })).toEqual({
      l: 0.305,
      c: 0.055,
      h: 290,
    })
  })
})

describe('normalizeRadius', () => {
  it('rounds to three decimals', () => {
    expect(normalizeRadius(0.6250000000001)).toBe(0.625)
  })
})

describe('primaryForeground', () => {
  it('puts dark text on a light fill', () => {
    expect(primaryForeground({ l: 0.8, c: 0.15, h: 90 })).toBe('oklch(0.15 0 0)')
  })

  it('puts light text on a dark fill', () => {
    expect(primaryForeground({ l: 0.4, c: 0.15, h: 260 })).toBe('oklch(0.985 0 0)')
  })
})

describe('themeVariables', () => {
  it('overrides primary, its foreground, and the radius', () => {
    const variables = themeVariables({ radius: 1, primary: { l: 0.5, c: 0.2, h: 200 } })

    expect(variables['--radius']).toBe('1rem')
    expect(variables['--primary']).toBe('oklch(0.5 0.2 200)')
    expect(variables['--primary-foreground']).toBe('oklch(0.985 0 0)')
  })

  it('keeps the sidebar brand in step with primary', () => {
    const variables = themeVariables({ radius: 0.5, primary: { l: 0.7, c: 0.1, h: 30 } })

    expect(variables['--sidebar-primary']).toBe(variables['--primary'])
    expect(variables['--sidebar-primary-foreground']).toBe(variables['--primary-foreground'])
  })
})

describe('themeCss', () => {
  it('targets :root for a light-theme draft', () => {
    expect(themeCss(DEFAULT_DRAFT, false)).toContain(':root {')
  })

  it('targets .dark for a dark-theme draft, so light mode is left alone', () => {
    const css = themeCss(DEFAULT_DRAFT, true)

    expect(css).toContain('.dark {')
    expect(css).not.toContain(':root')
  })

  it('emits one declaration per overridden variable', () => {
    const css = themeCss({ radius: 0.25, primary: { l: 0.6, c: 0.2, h: 15 } }, false)

    expect(css).toContain('  --radius: 0.25rem;')
    expect(css).toContain('  --primary: oklch(0.6 0.2 15);')
  })
})

describe('isDefaultDraft', () => {
  it('recognises the untouched draft', () => {
    expect(isDefaultDraft(DEFAULT_DRAFT)).toBe(true)
    expect(isDefaultDraft({ ...DEFAULT_DRAFT })).toBe(true)
  })

  it('detects a change in any channel', () => {
    expect(isDefaultDraft({ ...DEFAULT_DRAFT, radius: 0.5 })).toBe(false)
    expect(
      isDefaultDraft({ ...DEFAULT_DRAFT, primary: { ...DEFAULT_DRAFT.primary, h: 120 } }),
    ).toBe(false)
  })
})
