<script setup lang="ts">
import { Separator } from '@/components/ui/separator'
import { useI18n } from 'vue-i18n'
import SettingsUnitsSection from '@/features/settings/components/SettingsUnitsSection.vue'
import SettingsAppearanceSection from '@/features/settings/components/SettingsAppearanceSection.vue'
import SettingsScreenSection from '@/features/settings/components/SettingsScreenSection.vue'
import SettingsDataSection from '@/features/settings/components/SettingsDataSection.vue'
import SettingsDangerZoneSection from '@/features/settings/components/SettingsDangerZoneSection.vue'
import SettingsAboutSection from '@/features/settings/components/SettingsAboutSection.vue'

const { t } = useI18n()
</script>

<template>
  <div class="flex-1 p-4 pb-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('settings.title') }}</h1>
      <p class="text-muted-foreground mt-1">{{ t('settings.subtitle') }}</p>
    </div>

    <div class="space-y-8 max-w-2xl">
      <SettingsUnitsSection />
      <Separator />

      <SettingsAppearanceSection />
      <Separator />

      <SettingsScreenSection />
      <Separator />

      <SettingsDataSection />
      <Separator />

      <SettingsDangerZoneSection />
      <Separator />

      <SettingsAboutSection />
    </div>
  </div>
</template>
