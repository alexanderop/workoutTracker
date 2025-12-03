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
  Scale,
  Ruler,
  Moon,
  Smartphone,
  Download,
  Upload,
  Trash2,
  ChevronDown,
} from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useSettingsStore } from '@/stores/settings'
import { deleteAllData } from '@/db'
import { exportAllData, type ExportData } from '@/lib/dataExport'
import { importAllData, parseExportFile } from '@/lib/dataImport'
import SettingsDeleteAllDataDialog from '@/components/settings/SettingsDeleteAllDataDialog.vue'
import SettingsImportDataDialog from '@/components/settings/SettingsImportDataDialog.vue'
import SettingsImportErrorDialog from '@/components/settings/SettingsImportErrorDialog.vue'
import SettingsWakeLockDiagnostics from '@/components/settings/SettingsWakeLockDiagnostics.vue'

const { isDark } = useTheme()
const settingsStore = useSettingsStore()

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

function handleScreenWakeLockChange(enabled: boolean) {
  settingsStore.setScreenWakeLock(enabled)
}
</script>

<template>
  <div class="flex-1 p-4 pb-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground mt-1">Customize your app preferences</p>
    </div>

    <div class="space-y-8 max-w-2xl">
      <!-- Units Section -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Units
        </h2>
        <div class="space-y-4">
          <!-- Weight -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label class="flex items-center gap-3 text-base">
              <Scale class="size-5 text-muted-foreground" />
              Weight
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
                aria-label="Kilograms"
                class="flex-1 sm:flex-none min-h-11 px-6"
              >
                kg
              </ToggleGroupItem>
              <ToggleGroupItem
                value="lbs"
                aria-label="Pounds"
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
              Height
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
                aria-label="Centimeters"
                class="flex-1 sm:flex-none min-h-11 px-6"
              >
                cm
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ft-in"
                aria-label="Feet and Inches"
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
          Appearance
        </h2>
        <div class="flex items-center justify-between">
          <Label class="flex items-center gap-3 text-base cursor-pointer" for="theme-toggle">
            <Moon class="size-5 text-muted-foreground" />
            Dark Mode
          </Label>
          <Switch id="theme-toggle" v-model="isDark" data-testid="theme-toggle" />
        </div>
      </section>

      <Separator />

      <!-- Screen Section -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Screen
        </h2>
        <div class="space-y-4">
          <!-- Keep Screen On Toggle -->
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-start gap-3 min-w-0">
              <Smartphone class="size-5 text-muted-foreground mt-0.5 shrink-0" />
              <div class="min-w-0">
                <Label class="text-base cursor-pointer" for="wake-lock-toggle"
                  >Keep Screen On</Label
                >
                <p class="text-sm text-muted-foreground">Prevent dimming during workouts</p>
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

          <!-- Advanced/Debug Section -->
          <Collapsible v-model:open="advancedOpen" class="pt-2">
            <CollapsibleTrigger
              class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ChevronDown
                class="size-4 transition-transform duration-200"
                :class="{ '-rotate-180': advancedOpen }"
              />
              Advanced diagnostics
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
          Data
        </h2>
        <div class="space-y-3">
          <!-- Export -->
          <button
            type="button"
            aria-label="Export Data"
            class="flex items-center justify-between w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
            :disabled="isExporting"
            @click="handleExport"
          >
            <div class="flex items-center gap-3">
              <Download class="size-5 text-muted-foreground" />
              <div>
                <p class="font-medium">Export Data</p>
                <p class="text-sm text-muted-foreground">Download backup file</p>
              </div>
            </div>
            <span v-if="isExporting" class="text-sm text-muted-foreground">Exporting...</span>
          </button>

          <!-- Import -->
          <button
            type="button"
            aria-label="Import Data"
            class="flex items-center gap-3 w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
            @click="handleImportClick"
          >
            <Upload class="size-5 text-muted-foreground" />
            <div>
              <p class="font-medium">Import Data</p>
              <p class="text-sm text-muted-foreground">Restore from backup</p>
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
          Danger Zone
        </h2>
        <div class="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <Trash2 class="size-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p class="font-medium">Delete All Data</p>
                <p class="text-sm text-muted-foreground">
                  Permanently remove all workouts, exercises, and settings
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              aria-label="Delete All Data"
              class="w-full sm:w-auto min-h-11 shrink-0"
              @click="showDeleteDialog = true"
            >
              Delete All
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
    <SettingsImportErrorDialog v-model:open="showImportErrorDialog" :error="importError" />
  </div>
</template>
