<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Monitor, Video } from 'lucide-vue-next'
import { useScreenWakeLock } from '@/composables/useScreenWakeLock'

const wakeLock = useScreenWakeLock()

function toggleNativeWakeLock() {
  if (wakeLock.nativeIsActive.value) {
    wakeLock.releaseNative()
    return
  }
  wakeLock.acquireNative()
}

function toggleVideoFallback() {
  if (wakeLock.videoIsActive.value) {
    wakeLock.stopVideoFallback()
    return
  }
  wakeLock.startVideoFallback()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Native Wake Lock API -->
    <div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
      <div class="flex items-center gap-3 min-w-0">
        <Monitor class="size-4 text-muted-foreground shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-medium">Wake Lock API</p>
          <p class="text-xs text-muted-foreground">Native browser API</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span
          class="text-xs px-2 py-1 rounded-full"
          :class="
            wakeLock.nativeIsActive.value
              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
          "
        >
          {{ wakeLock.nativeIsActive.value ? 'Active' : 'Inactive' }}
        </span>
        <Button
          v-if="wakeLock.isSupported.value"
          variant="outline"
          size="sm"
          data-testid="wake-lock-test"
          class="min-h-9"
          @click="toggleNativeWakeLock"
        >
          {{ wakeLock.nativeIsActive.value ? 'Release' : 'Test' }}
        </Button>
        <span v-else class="text-xs text-destructive">Not supported</span>
      </div>
    </div>

    <!-- Video Fallback -->
    <div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
      <div class="flex items-center gap-3 min-w-0">
        <Video class="size-4 text-muted-foreground shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-medium">Video Fallback</p>
          <p class="text-xs text-muted-foreground">Silent video method</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span
          class="text-xs px-2 py-1 rounded-full"
          :class="
            wakeLock.videoIsActive.value
              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
          "
        >
          {{ wakeLock.videoIsActive.value ? 'Active' : 'Inactive' }}
        </span>
        <Button variant="outline" size="sm" class="min-h-9" @click="toggleVideoFallback">
          {{ wakeLock.videoIsActive.value ? 'Stop' : 'Test' }}
        </Button>
      </div>
    </div>

    <p v-if="wakeLock.isActive.value" class="text-sm text-amber-600 dark:text-amber-400 pl-7">
      Screen should stay on. Leave phone idle for 2 minutes to test.
    </p>

    <p class="text-xs text-muted-foreground pl-7">
      If neither works: Settings → Apps → Battery → Set to "Unrestricted"
    </p>
  </div>
</template>
