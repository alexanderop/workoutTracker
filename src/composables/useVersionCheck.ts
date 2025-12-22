import { computed, ref, shallowRef } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { VersionInfo } from '@/types/version'
import { tryCatch } from '@/lib/tryCatch'

const POLL_INTERVAL_MS = 30_000 // 30 seconds

// Singleton state - shared across all instances
const serverVersion = shallowRef<VersionInfo | null>(null)
const error = ref<Error | null>(null)
const isChecking = ref(false)

// Built-in version from build time (static)
const currentVersion: VersionInfo = {
  version: import.meta.env.APP_VERSION,
  tag: import.meta.env.APP_TAG,
  commit: import.meta.env.APP_COMMIT,
  buildTime: import.meta.env.APP_BUILD_TIME,
}

function isVersionInfo(value: unknown): value is VersionInfo {
  if (typeof value !== 'object' || value === null) return false
  if (!('version' in value) || typeof value.version !== 'string') return false
  if (!('tag' in value) || (typeof value.tag !== 'string' && value.tag !== null)) return false
  if (!('commit' in value) || typeof value.commit !== 'string') return false
  if (!('buildTime' in value) || typeof value.buildTime !== 'string') return false
  return true
}

async function checkVersion(): Promise<void> {
  if (isChecking.value) return
  isChecking.value = true
  error.value = null

  const [fetchError, response] = await tryCatch(
    fetch('/version.json', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    }),
  )

  if (fetchError) {
    error.value = fetchError
    isChecking.value = false
    return
  }

  if (!response.ok) {
    error.value = new Error(`Failed to fetch version: ${response.status}`)
    isChecking.value = false
    return
  }

  const [parseError, data] = await tryCatch(response.json())

  if (parseError) {
    error.value = parseError
    isChecking.value = false
    return
  }

  if (!isVersionInfo(data)) {
    error.value = new Error('Invalid version info format')
    isChecking.value = false
    return
  }

  serverVersion.value = data
  isChecking.value = false
}

// Computed outside composable for singleton behavior
const isNewVersion = computed(() => {
  if (!serverVersion.value) return false
  // Compare by commit hash - most reliable for detecting new deployments
  return serverVersion.value.commit !== currentVersion.commit
})

export function useVersionCheck() {
  // Start polling when first used
  const { pause, resume } = useIntervalFn(checkVersion, POLL_INTERVAL_MS, {
    immediate: true,
    immediateCallback: true,
  })

  return {
    // State
    currentVersion,
    serverVersion,
    isNewVersion,
    error,
    isChecking,

    // Methods
    checkVersion,
    pauseChecking: pause,
    resumeChecking: resume,
  }
}
