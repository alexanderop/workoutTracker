import { computed } from 'vue'
import type { ConfigurableWindow } from '@vueuse/core'
import { createSharedComposable, defaultWindow, useColorMode } from '@vueuse/core'

export type UseThemeOptions = ConfigurableWindow

const useSharedTheme = createSharedComposable((options: UseThemeOptions = {}) => {
  const { window = defaultWindow } = options

  // 1. Initializing - external dependencies
  const colorMode = useColorMode({
    attribute: 'class',
    modes: {
      light: '',
      dark: 'dark',
    },
    window,
  })

  // 4. Computed - derived state
  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (value: boolean) => {
      colorMode.value = value ? 'dark' : 'light'
    },
  })

  return { colorMode, isDark }
})

export function useTheme(options: UseThemeOptions = {}) {
  return useSharedTheme(options)
}
