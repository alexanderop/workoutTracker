<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Monitor, Video } from 'lucide-vue-next'
import { useScreenWakeLock } from '@/composables/useScreenWakeLock'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
          <p class="text-sm font-medium">{{ t('settings.diagnostics.wakeLockApi') }}</p>
          <p class="text-xs text-muted-foreground">
            {{ t('settings.diagnostics.nativeBrowserApi') }}
          </p>
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
          {{
            wakeLock.nativeIsActive.value
              ? t('settings.diagnostics.active')
              : t('settings.diagnostics.inactive')
          }}
        </span>
        <Button
          v-if="wakeLock.isSupported.value"
          variant="outline"
          size="sm"
          data-testid="wake-lock-test"
          class="min-h-9"
          @click="toggleNativeWakeLock"
        >
          {{
            wakeLock.nativeIsActive.value
              ? t('settings.diagnostics.release')
              : t('settings.diagnostics.test')
          }}
        </Button>
        <span v-else class="text-xs text-destructive">{{
          t('settings.diagnostics.notSupported')
        }}</span>
      </div>
    </div>

    <!-- Video Fallback -->
    <div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
      <div class="flex items-center gap-3 min-w-0">
        <Video class="size-4 text-muted-foreground shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ t('settings.diagnostics.videoFallback') }}</p>
          <p class="text-xs text-muted-foreground">
            {{ t('settings.diagnostics.silentVideoMethod') }}
          </p>
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
          {{
            wakeLock.videoIsActive.value
              ? t('settings.diagnostics.active')
              : t('settings.diagnostics.inactive')
          }}
        </span>
        <Button variant="outline" size="sm" class="min-h-9" @click="toggleVideoFallback">
          {{
            wakeLock.videoIsActive.value
              ? t('settings.diagnostics.stop')
              : t('settings.diagnostics.test')
          }}
        </Button>
      </div>
    </div>

    <p v-if="wakeLock.isActive.value" class="text-sm text-amber-600 dark:text-amber-400 pl-7">
      {{ t('settings.diagnostics.screenShouldStayOn') }}
    </p>

    <p class="text-xs text-muted-foreground pl-7">
      {{ t('settings.diagnostics.batterySettings') }}
    </p>
  </div>
</template>
