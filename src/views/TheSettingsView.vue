<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Scale,
  Ruler,
  Moon,
  Smartphone,
  Download,
  Upload,
  Trash2,
  ChevronDown,
  Globe,
  Volume2,
} from 'lucide-vue-next'
import { useTheme } from '@/features/settings/composables/useTheme'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'
import { deleteAllData } from '@/db'
import { exportAllData, type ExportData } from '@/features/settings/utils/dataExport'
import { importAllData, parseExportFile } from '@/features/settings/utils/dataImport'
import { tryCatch } from '@/lib/tryCatch'
import SettingsDeleteAllDataDialog from '@/features/settings/components/SettingsDeleteAllDataDialog.vue'
import SettingsImportDataDialog from '@/features/settings/components/SettingsImportDataDialog.vue'
import ErrorDialog from '@/components/ErrorDialog.vue'
import SettingsWakeLockDiagnostics from '@/features/settings/components/SettingsWakeLockDiagnostics.vue'

const { isDark } = useTheme()
const settingsStore = useSettingsStore()
const { t } = useI18n()

const showDeleteDialog = ref(false)
const showImportDialog = ref(false)
const advancedOpen = ref(false)
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

const showExportError = ref(false)

async function handleExport() {
  isExporting.value = true
  const [error] = await tryCatch(exportAllData())
  if (error) {
    showExportError.value = true
  }
  isExporting.value = false
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
  const [error] = await tryCatch(importAllData(importData.value))
  isImporting.value = false

  if (error) {
    importError.value = t('settings.errors.importFailed')
    showImportErrorDialog.value = true
    return
  }

  window.location.reload()
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

function handleScreenWakeLockChange(enabled: boolean) {
  settingsStore.setScreenWakeLock(enabled)
}

function handleTimerSoundChange(enabled: boolean) {
  settingsStore.setTimerSoundEnabled(enabled)
}

function handleLanguageChange(value: AcceptableValue) {
  if (value === 'en' || value === 'de') {
    settingsStore.setLanguage(value)
  }
}
</script>

<template>
  <div class="flex-1 p-4 pb-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('settings.title') }}</h1>
      <p class="text-muted-foreground mt-1">{{ t('settings.subtitle') }}</p>
    </div>

    <div class="space-y-8 max-w-2xl">
      <!-- Units Section -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {{ t('settings.sections.units') }}
        </h2>
        <div class="space-y-4">
          <!-- Weight -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label class="flex items-center gap-3 text-base">
              <Scale class="size-5 text-muted-foreground" />
              {{ t('settings.labels.weight') }}
            </Label>
            <ToggleGroup
              type="single"
              :model-value="settingsStore.weightUnit"
              variant="outline"
              data-testid="weight-unit-toggle"
              class="w-full sm:w-auto [&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
              @update:model-value="handleWeightUnitChange"
            >
              <ToggleGroupItem
                value="kg"
                :aria-label="t('settings.labels.ariaKilograms')"
                class="flex-1 sm:flex-none min-h-11 px-6"
              >
                kg
              </ToggleGroupItem>
              <ToggleGroupItem
                value="lbs"
                :aria-label="t('settings.labels.ariaPounds')"
                class="flex-1 sm:flex-none min-h-11 px-6"
              >
                lbs
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <!-- Height -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label class="flex items-center gap-3 text-base">
              <Ruler class="size-5 text-muted-foreground" />
              {{ t('settings.labels.height') }}
            </Label>
            <ToggleGroup
              type="single"
              :model-value="settingsStore.heightUnit"
              variant="outline"
              data-testid="height-unit-toggle"
              class="w-full sm:w-auto [&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
              @update:model-value="handleHeightUnitChange"
            >
              <ToggleGroupItem
                value="cm"
                :aria-label="t('settings.labels.ariaCentimeters')"
                class="flex-1 sm:flex-none min-h-11 px-6"
              >
                cm
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ft-in"
                :aria-label="t('settings.labels.ariaFeetAndInches')"
                class="flex-1 sm:flex-none min-h-11 px-6"
              >
                ft/in
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </section>

      <Separator />

      <!-- Appearance Section -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {{ t('settings.sections.appearance') }}
        </h2>
        <div class="space-y-4">
          <!-- Dark Mode -->
          <div class="flex items-center justify-between">
            <Label class="flex items-center gap-3 text-base cursor-pointer" for="theme-toggle">
              <Moon class="size-5 text-muted-foreground" />
              {{ t('settings.labels.darkMode') }}
            </Label>
            <Switch id="theme-toggle" v-model="isDark" data-testid="theme-toggle" />
          </div>

          <!-- Language -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label class="flex items-center gap-3 text-base">
              <Globe class="size-5 text-muted-foreground" />
              {{ t('settings.labels.language') }}
            </Label>
            <Select
              :model-value="settingsStore.language"
              data-testid="language-select"
              @update:model-value="handleLanguageChange"
            >
              <SelectTrigger class="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{{ t('settings.languages.en') }}</SelectItem>
                <SelectItem value="de">{{ t('settings.languages.de') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      <!-- Screen Section -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {{ t('settings.sections.screen') }}
        </h2>
        <div class="space-y-4">
          <!-- Keep Screen On Toggle -->
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-start gap-3 min-w-0">
              <Smartphone class="size-5 text-muted-foreground mt-0.5 shrink-0" />
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
              <Volume2 class="size-5 text-muted-foreground mt-0.5 shrink-0" />
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

          <!-- Advanced/Debug Section -->
          <Collapsible v-model:open="advancedOpen" class="pt-2">
            <CollapsibleTrigger
              class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ChevronDown
                class="size-4 transition-transform duration-200"
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

      <Separator />

      <!-- Data Section -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {{ t('settings.sections.data') }}
        </h2>
        <div class="space-y-3">
          <!-- Export -->
          <button
            type="button"
            :aria-label="t('settings.labels.ariaExportData')"
            class="flex items-center justify-between w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
            :disabled="isExporting"
            @click="handleExport"
          >
            <div class="flex items-center gap-3">
              <Download class="size-5 text-muted-foreground" />
              <div>
                <p class="font-medium">{{ t('settings.labels.exportData') }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ t('settings.labels.downloadBackup') }}
                </p>
              </div>
            </div>
            <span v-if="isExporting" class="text-sm text-muted-foreground">{{
              t('settings.labels.exporting')
            }}</span>
          </button>

          <!-- Import -->
          <button
            type="button"
            :aria-label="t('settings.labels.ariaImportData')"
            class="flex items-center gap-3 w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
            @click="handleImportClick"
          >
            <Upload class="size-5 text-muted-foreground" />
            <div>
              <p class="font-medium">{{ t('settings.labels.importData') }}</p>
              <p class="text-sm text-muted-foreground">
                {{ t('settings.labels.restoreFromBackup') }}
              </p>
            </div>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>
      </section>

      <Separator />

      <!-- Danger Zone -->
      <section>
        <h2 class="text-sm font-semibold text-destructive uppercase tracking-wider mb-4">
          {{ t('settings.sections.dangerZone') }}
        </h2>
        <div class="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <Trash2 class="size-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p class="font-medium">{{ t('settings.labels.deleteAllData') }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ t('settings.labels.deleteAllDataDescription') }}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              :aria-label="t('settings.labels.ariaDeleteAllData')"
              class="w-full sm:w-auto min-h-11 shrink-0"
              @click="showDeleteDialog = true"
            >
              {{ t('settings.labels.deleteAll') }}
            </Button>
          </div>
        </div>
      </section>
    </div>

    <SettingsDeleteAllDataDialog v-model:open="showDeleteDialog" @confirm="handleDeleteAllData" />
    <SettingsImportDataDialog
      v-if="importData"
      v-model:open="showImportDialog"
      :data="importData"
      :is-importing="isImporting"
      @confirm="handleImportConfirm"
    />
    <ErrorDialog v-model:open="showImportErrorDialog" :error="importError" />
    <ErrorDialog
      v-model:open="showExportError"
      :error="t('settings.errors.exportFailed.message')"
      :title="t('settings.errors.exportFailed.title')"
    />
  </div>
</template>
