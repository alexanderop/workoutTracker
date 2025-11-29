import { useColorMode } from '@vueuse/core'
import { computed, watch } from 'vue'

export function useTheme() {
  // 1. Initializing - external dependencies
  const colorMode = useColorMode({
    attribute: 'class',
    modes: {
      light: '',
      dark: 'dark',
    },
  })

  // 4. Computed - derived state
  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (value: boolean) => {
      colorMode.value = value ? 'dark' : 'light'
    },
  })

  // 7. Watchers - sync HTML class with color mode
  watch(
    () => colorMode.value,
    (newMode) => {
      const html = document.documentElement
      if (newMode === 'dark') {
        html.classList.add('dark')
      }
      else {
        html.classList.remove('dark')
      }
    },
    { immediate: true },
  )

  return { colorMode, isDark }
}
