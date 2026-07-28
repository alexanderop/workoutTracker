import { afterEach, describe, expect, it } from 'vitest'
import { useTheme } from '@/features/settings/composables/useTheme'
import { withSetup } from '../helpers/withSetup'

describe('useTheme', () => {
  afterEach(() => {
    localStorage.removeItem('vueuse-color-scheme')
    document.documentElement.classList.remove('dark')
  })

  it('shares one color-mode instance between consumers', () => {
    const [themes, app] = withSetup(() => ({ first: useTheme(), second: useTheme() }))

    expect(themes.first.colorMode).toBe(themes.second.colorMode)
    expect(themes.first.isDark).toBe(themes.second.isDark)

    app.unmount()
  })
})
