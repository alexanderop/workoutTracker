<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Moon, Globe } from 'lucide-vue-next'
import { useTheme } from '@/features/settings/composables/useTheme'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'

const { isDark } = useTheme()
const settingsStore = useSettingsStore()
const { t } = useI18n()

function handleLanguageChange(value: AcceptableValue) {
  if (value === 'en' || value === 'de') {
    settingsStore.setLanguage(value)
  }
}
</script>

<template>
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
          <SelectTrigger class="w-full sm:w-[180px]" :aria-label="t('settings.labels.language')">
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
</template>
