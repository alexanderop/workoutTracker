<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Dumbbell, Info, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { useVersionCheck } from '@/composables/useVersionCheck'
import { getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

const { t } = useI18n()
const { currentVersion, isNewVersion } = useVersionCheck()

const totalWorkouts = ref(0)

onMounted(async () => {
  const [error, count] = await tryCatch(getWorkoutsRepository().count())
  if (!error && typeof count === 'number') {
    totalWorkouts.value = count
  }
})

const formattedBuildTime = computed(() => {
  if (!currentVersion.buildTime) return '-'
  const date = new Date(currentVersion.buildTime)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})

function handleRefresh() {
  globalThis.location.reload()
}
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      {{ t('settings.sections.about') }}
    </h2>
    <div class="space-y-4">
      <!-- Total Workouts -->
      <div class="flex items-start gap-3">
        <Dumbbell class="icon-md text-muted-foreground mt-0.5" />
        <div class="flex-1">
          <p class="font-medium">{{ t('settings.labels.totalWorkouts') }}</p>
          <p class="text-sm text-muted-foreground" data-testid="settings-total-workouts">
            {{ totalWorkouts }}
          </p>
        </div>
      </div>

      <!-- Version Info -->
      <div class="flex items-start gap-3">
        <Info class="icon-md text-muted-foreground mt-0.5" />
        <div class="flex-1">
          <p class="font-medium">{{ t('settings.labels.version') }}</p>
          <p class="text-sm text-muted-foreground">
            {{ currentVersion.version }}
            <template v-if="currentVersion.tag">
              ({{ currentVersion.tag }})
            </template>
          </p>
          <div class="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p>{{ t('settings.labels.commit') }}: {{ currentVersion.commit }}</p>
            <p>{{ t('settings.labels.buildTime') }}: {{ formattedBuildTime }}</p>
          </div>
        </div>
      </div>

      <!-- Update Available -->
      <div
        v-if="isNewVersion"
        class="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20"
      >
        <div>
          <p class="font-medium text-primary">{{ t('settings.labels.updateAvailable') }}</p>
          <p class="text-sm text-muted-foreground">{{ t('settings.labels.refreshToUpdate') }}</p>
        </div>
        <Button size="sm" @click="handleRefresh">
          <RefreshCw class="icon-sm mr-1" />
          {{ t('common.buttons.refresh') }}
        </Button>
      </div>
    </div>
  </section>
</template>
