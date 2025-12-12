<script setup lang="ts">
import { ref } from 'vue'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Smartphone, Volume2, ChevronDown } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'
import SettingsWakeLockDiagnostics from './SettingsWakeLockDiagnostics.vue'

const settingsStore = useSettingsStore()
const { t } = useI18n()

const advancedOpen = ref(false)

function handleScreenWakeLockChange(enabled: boolean) {
  settingsStore.setScreenWakeLock(enabled)
}

function handleTimerSoundChange(enabled: boolean) {
  settingsStore.setTimerSoundEnabled(enabled)
}

function handleTimerSoundVolumeChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const volume = parseFloat(target.value)
  settingsStore.setTimerSoundVolume(volume)
}
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      {{ t('settings.sections.screen') }}
    </h2>
    <div class="space-y-4">
      <!-- Keep Screen On Toggle -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-start gap-3 min-w-0">
          <Smartphone class="icon-md text-muted-foreground mt-0.5 shrink-0" />
          <div class="min-w-0">
            <Label class="text-base cursor-pointer" for="wake-lock-toggle">{{
              t('settings.labels.keepScreenOn')
            }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ t('settings.labels.preventDimming') }}
            </p>
          </div>
        </div>
        <Switch
          id="wake-lock-toggle"
          :model-value="settingsStore.screenWakeLock"
          data-testid="screen-wake-lock-toggle"
          class="shrink-0"
          @update:model-value="handleScreenWakeLockChange"
        />
      </div>

      <!-- Timer Sounds Toggle -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-start gap-3 min-w-0">
          <Volume2 class="icon-md text-muted-foreground mt-0.5 shrink-0" />
          <div class="min-w-0">
            <Label class="text-base cursor-pointer" for="timer-sound-toggle">{{
              t('settings.labels.timerSounds')
            }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ t('settings.labels.playAudioCues') }}
            </p>
          </div>
        </div>
        <Switch
          id="timer-sound-toggle"
          :model-value="settingsStore.timerSoundEnabled"
          data-testid="timer-sound-toggle"
          class="shrink-0"
          @update:model-value="handleTimerSoundChange"
        />
      </div>

      <!-- Timer Sound Volume Control -->
      <div v-if="settingsStore.timerSoundEnabled" class="flex flex-col gap-3">
        <Label class="text-base" for="timer-sound-volume">{{
          t('settings.labels.timerSoundVolume')
        }}</Label>
        <div class="flex items-center gap-4">
          <input
            id="timer-sound-volume"
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            :value="settingsStore.timerSoundVolume"
            data-testid="timer-sound-volume-slider"
            class="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            @change="handleTimerSoundVolumeChange"
          />
          <span class="text-sm font-medium text-muted-foreground min-w-12">
            {{ Math.round(settingsStore.timerSoundVolume * 100) }}%
          </span>
        </div>
        <p class="text-xs text-muted-foreground">{{ t('settings.labels.volumeRange') }}</p>
      </div>

      <!-- Advanced/Debug Section -->
      <Collapsible v-model:open="advancedOpen" class="pt-2">
        <CollapsibleTrigger
          class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <ChevronDown
            class="icon-sm transition-transform duration-200"
            :class="{ '-rotate-180': advancedOpen }"
          />
          {{ t('settings.labels.advancedDiagnostics') }}
        </CollapsibleTrigger>
        <CollapsibleContent class="pt-4">
          <SettingsWakeLockDiagnostics />
        </CollapsibleContent>
      </Collapsible>
    </div>
  </section>
</template>
