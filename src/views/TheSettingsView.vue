<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { useWakeLock } from '@vueuse/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/composables/useTheme'
import { useSettingsStore } from '@/stores/settings'
import { deleteAllData } from '@/db'
import { exportAllData, type ExportData } from '@/lib/dataExport'
import { importAllData, parseExportFile } from '@/lib/dataImport'
import SettingsDeleteAllDataDialog from '@/components/settings/SettingsDeleteAllDataDialog.vue'
import SettingsImportDataDialog from '@/components/settings/SettingsImportDataDialog.vue'
import SettingsImportErrorDialog from '@/components/settings/SettingsImportErrorDialog.vue'

const { isDark } = useTheme()
const settingsStore = useSettingsStore()

// Wake Lock testing
const {
  isSupported: wakeLockSupported,
  isActive: wakeLockActive,
  request: requestWakeLock,
  release: releaseWakeLock,
} = useWakeLock()

const videoFallbackActive = ref(false)
let videoElement: HTMLVideoElement | null = null

async function toggleWakeLock() {
  if (wakeLockActive.value) {
    await releaseWakeLock()
    return
  }
  await requestWakeLock('screen')
}

function toggleVideoFallback() {
  if (videoFallbackActive.value) {
    stopVideoFallback()
    return
  }
  startVideoFallback()
}

function startVideoFallback() {
  if (videoElement) return
  videoElement = document.createElement('video')
  videoElement.setAttribute('playsinline', '')
  videoElement.setAttribute('muted', '')
  videoElement.muted = true
  // Minimal silent MP4
  videoElement.src =
    'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAwBtZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACGHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAIAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAGQAAAAAAAEAAAAAAZBtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAACgAAAAEAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAE7bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAA+3N0YmwAAACXc3RzZAAAAAAAAAABAAAAh2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZX4iIhAAAAwAEAAADAFA8SJZYAQAGaOvjyyLAAAAAGHN0dHMAAAAAAAAAAQAAAAEAAAQAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAsUAAAABAAAAFHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU3LjgzLjEwMA=='
  videoElement.loop = true
  videoElement.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px'
  document.body.appendChild(videoElement)
  videoElement.play().catch(() => {})
  videoFallbackActive.value = true
}

function stopVideoFallback() {
  if (!videoElement) return
  videoElement.pause()
  videoElement.remove()
  videoElement = null
  videoFallbackActive.value = false
}

const showDeleteDialog = ref(false)
const showImportDialog = ref(false)
const showImportErrorDialog = ref(false)
const importData = ref<ExportData | null>(null)
const importError = ref('')
const isExporting = ref(false)
const isImporting = ref(false)
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')

async function handleDeleteAllData() {
  await deleteAllData()
  window.location.reload()
}

async function handleExport() {
  isExporting.value = true
  try {
    await exportAllData()
  } finally {
    isExporting.value = false
  }
}

function handleImportClick() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  const file = input.files?.[0]

  // Reset the input so the same file can be selected again
  input.value = ''

  if (!file) return

  const result = await parseExportFile(file)

  if (!result.success) {
    importError.value = result.error
    showImportErrorDialog.value = true
    return
  }

  importData.value = result.data
  showImportDialog.value = true
}

async function handleImportConfirm() {
  if (!importData.value) return

  isImporting.value = true
  try {
    await importAllData(importData.value)
    window.location.reload()
  } catch {
    importError.value = 'Failed to import your data. Please try again.'
    showImportErrorDialog.value = true
  } finally {
    isImporting.value = false
  }
}

function handleWeightUnitChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === 'kg' || value === 'lbs') {
    settingsStore.weightUnit = value
  }
}

function handleHeightUnitChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === 'cm' || value === 'ft-in') {
    settingsStore.heightUnit = value
  }
}
</script>

<template>
  <div class="flex-1 p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Settings</h1>
      <p class="text-muted-foreground">Customize your app preferences</p>
    </div>

    <div class="space-y-4 max-w-2xl">
      <!-- Units Section -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Units</CardTitle>
          <CardDescription>Choose your preferred measurement units</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <Label>Weight</Label>
            <ToggleGroup
              type="single"
              :model-value="settingsStore.weightUnit"
              variant="outline"
              data-testid="weight-unit-toggle"
              class="[&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
              @update:model-value="handleWeightUnitChange"
            >
              <ToggleGroupItem value="kg" aria-label="Kilograms">kg</ToggleGroupItem>
              <ToggleGroupItem value="lbs" aria-label="Pounds">lbs</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div class="flex items-center justify-between">
            <Label>Height</Label>
            <ToggleGroup
              type="single"
              :model-value="settingsStore.heightUnit"
              variant="outline"
              data-testid="height-unit-toggle"
              class="[&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
              @update:model-value="handleHeightUnitChange"
            >
              <ToggleGroupItem value="cm" aria-label="Centimeters">cm</ToggleGroupItem>
              <ToggleGroupItem value="ft-in" aria-label="Feet and Inches">ft/in</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      <!-- Appearance Section -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center space-x-2">
            <Switch v-model="isDark" data-testid="theme-toggle" />
            <Label>Dark Mode</Label>
          </div>
        </CardContent>
      </Card>

      <!-- Device Features Section -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Device Features</CardTitle>
          <CardDescription>Test screen wake lock methods</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Native Wake Lock API -->
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Wake Lock API</p>
              <p class="text-sm text-muted-foreground">Native browser API</p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="text-xs px-2 py-1 rounded-full"
                :class="
                  wakeLockActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                "
              >
                {{ wakeLockActive ? 'Active' : 'Inactive' }}
              </span>
              <Button
                v-if="wakeLockSupported"
                variant="outline"
                size="sm"
                data-testid="wake-lock-test"
                @click="toggleWakeLock"
              >
                {{ wakeLockActive ? 'Release' : 'Test' }}
              </Button>
              <span v-else class="text-xs text-red-500">Not supported</span>
            </div>
          </div>

          <!-- Video Fallback -->
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Video Fallback</p>
              <p class="text-sm text-muted-foreground">Silent video keeps screen on</p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="text-xs px-2 py-1 rounded-full"
                :class="
                  videoFallbackActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                "
              >
                {{ videoFallbackActive ? 'Active' : 'Inactive' }}
              </span>
              <Button variant="outline" size="sm" @click="toggleVideoFallback">
                {{ videoFallbackActive ? 'Stop' : 'Test' }}
              </Button>
            </div>
          </div>

          <p
            v-if="wakeLockActive || videoFallbackActive"
            class="text-sm text-amber-600 dark:text-amber-400"
          >
            Screen should stay on. Leave phone idle for 2 minutes to test.
          </p>

          <p class="text-xs text-muted-foreground pt-2 border-t">
            If neither works, check: Settings → Apps → Battery → Set to "Unrestricted"
          </p>
        </CardContent>
      </Card>

      <!-- Data Management Section -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Data Management</CardTitle>
          <CardDescription>Manage your app data</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Export Data</p>
              <p class="text-sm text-muted-foreground">Download all your data as a backup file</p>
            </div>
            <Button variant="outline" :disabled="isExporting" @click="handleExport">
              {{ isExporting ? 'Exporting...' : 'Export Data' }}
            </Button>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Import Data</p>
              <p class="text-sm text-muted-foreground">Restore data from a backup file</p>
            </div>
            <Button variant="outline" @click="handleImportClick"> Import Data </Button>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="handleFileSelect"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Delete All Data</p>
              <p class="text-sm text-muted-foreground">
                Permanently delete all workouts, exercises, templates, and settings
              </p>
            </div>
            <Button variant="destructive" @click="showDeleteDialog = true">
              Delete All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <SettingsDeleteAllDataDialog v-model:open="showDeleteDialog" @confirm="handleDeleteAllData" />
    <SettingsImportDataDialog
      v-if="importData"
      v-model:open="showImportDialog"
      :data="importData"
      :is-importing="isImporting"
      @confirm="handleImportConfirm"
    />
    <SettingsImportErrorDialog v-model:open="showImportErrorDialog" :error="importError" />
  </div>
</template>
