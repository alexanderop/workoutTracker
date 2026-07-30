import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useTheme } from '@/features/settings/composables/useTheme'
import { withSetup } from '../helpers/withSetup'

describe('useTheme', () => {
  afterEach(() => {
    localStorage.removeItem('vueuse-color-scheme')
    document.documentElement.classList.remove('dark')
  })

  it('shares one color-mode instance between consumers', async () => {
    const [themes, app] = withSetup(() => ({ first: useTheme(), second: useTheme() }))

    expect(themes.first.colorMode).toBe(themes.second.colorMode)
    expect(themes.first.isDark).toBe(themes.second.isDark)

    themes.first.isDark.value = true
    await nextTick()
    expect(document.documentElement.classList).toContain('dark')

    themes.first.isDark.value = false
    await nextTick()
    expect(document.documentElement.classList).not.toContain('dark')

    app.unmount()
  })
})
