import { describe, expect, it } from 'vitest'
import {
  initialControlState,
  readBoolean,
  readOption,
  readText,
} from '@/features/design-system/lib/controls'
import type { DesignControl } from '@/features/design-system/types'

const controls: ReadonlyArray<DesignControl> = [
  {
    kind: 'select',
    key: 'variant',
    label: 'Variant',
    options: ['default', 'outline'],
    initial: 'default',
  },
  { kind: 'switch', key: 'disabled', label: 'Disabled', initial: false },
  { kind: 'text', key: 'label', label: 'Label', initial: 'Log set' },
]

describe('initialControlState', () => {
  it('seeds every declared control with its initial value', () => {
    expect(initialControlState(controls)).toEqual({
      variant: 'default',
      disabled: false,
      label: 'Log set',
    })
  })

  it('returns an empty bag for a frame with no controls', () => {
    expect(initialControlState(undefined)).toEqual({})
  })
})

describe('readOption', () => {
  const options = ['default', 'outline', 'ghost'] as const

  it('returns the stored value when it is one of the options', () => {
    expect(readOption({ variant: 'ghost' }, 'variant', options, 'default')).toBe('ghost')
  })

  it('falls back when the stored value is stale', () => {
    // A control was renamed and the old value lingers in state.
    expect(readOption({ variant: 'jumbo' }, 'variant', options, 'default')).toBe('default')
  })

  it('falls back for a missing key or missing state', () => {
    expect(readOption({}, 'variant', options, 'outline')).toBe('outline')
    expect(readOption(undefined, 'variant', options, 'outline')).toBe('outline')
  })

  it('does not confuse a boolean value for an option', () => {
    expect(readOption({ variant: true }, 'variant', options, 'default')).toBe('default')
  })
})

describe('readBoolean', () => {
  it('reads booleans and ignores anything else', () => {
    expect(readBoolean({ disabled: true }, 'disabled', false)).toBe(true)
    expect(readBoolean({ disabled: false }, 'disabled', true)).toBe(false)
    expect(readBoolean({ disabled: 'true' }, 'disabled', false)).toBe(false)
    expect(readBoolean(undefined, 'disabled', true)).toBe(true)
  })
})

describe('readText', () => {
  it('reads non-empty strings', () => {
    expect(readText({ label: 'Finish' }, 'label', 'Log set')).toBe('Finish')
  })

  it('falls back for an empty string so a cleared field still renders', () => {
    expect(readText({ label: '' }, 'label', 'Log set')).toBe('Log set')
  })

  it('falls back for a non-string value', () => {
    expect(readText({ label: false }, 'label', 'Log set')).toBe('Log set')
  })
})
