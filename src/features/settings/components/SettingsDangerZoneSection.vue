<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Trash2 } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { deleteAllData } from '@/db'
import { useReloadPage } from '@/features/settings/utils/reloadPage'
import SettingsDeleteAllDataDialog from './SettingsDeleteAllDataDialog.vue'

const { t } = useI18n()
const reloadPage = useReloadPage()

const showDeleteDialog = ref(false)

async function handleDeleteAllData() {
  await deleteAllData()
  reloadPage()
}
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold text-destructive uppercase tracking-wider mb-4">
      {{ t('settings.sections.dangerZone') }}
    </h2>
    <div class="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-start gap-3">
          <Trash2 class="icon-md text-destructive mt-0.5 shrink-0" />
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

    <SettingsDeleteAllDataDialog v-model:open="showDeleteDialog" @confirm="handleDeleteAllData" />
  </section>
</template>
