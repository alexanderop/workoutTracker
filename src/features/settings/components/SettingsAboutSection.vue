<script setup lang="ts">
import { computed } from 'vue'
import { Info, Palette } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { currentVersion } from '@/features/settings/utils/appVersion'
import { RouteNames } from '@/router'

const { t } = useI18n()
const router = useRouter()

const formattedBuildTime = computed(() => {
  if (!currentVersion.buildTime) return '-'
  const date = new Date(currentVersion.buildTime)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      {{ t('settings.sections.about') }}
    </h2>
    <div class="space-y-4">
      <!-- Version Info -->
      <div class="flex items-start gap-3">
        <Info class="icon-md text-muted-foreground mt-0.5" />
        <div class="flex-1">
          <p class="font-medium">{{ t('settings.labels.version') }}</p>
          <p class="text-sm text-muted-foreground">
            {{ currentVersion.version }}
            <template v-if="currentVersion.tag"> ({{ currentVersion.tag }}) </template>
          </p>
          <div class="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p>{{ t('settings.labels.commit') }}: {{ currentVersion.commit }}</p>
            <p>{{ t('settings.labels.buildTime') }}: {{ formattedBuildTime }}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border p-3">
        <Palette class="icon-md shrink-0 text-primary" />
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ t('settings.labels.healthPrototypes') }}</p>
          <p class="text-sm text-muted-foreground">
            {{ t('settings.labels.healthPrototypesDescription') }}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="router.push({ name: RouteNames.HealthPrototypes })"
        >
          {{ t('settings.labels.openHealthPrototypes') }}
        </Button>
      </div>
    </div>
  </section>
</template>
