<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FileText } from 'lucide-vue-next'
import type { SampleTemplate } from '../../constants/previewData'

const { template } = defineProps<{
  template: SampleTemplate
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <FileText class="h-5 w-5 text-primary" />
    </div>
    <div class="min-w-0 flex-1 text-left">
      <p class="truncate font-medium">{{ template.name }}</p>
      <p class="text-sm text-muted-foreground">
        {{ t('onboarding.templates.blockCount', { count: template.blockCount }) }}
      </p>
    </div>
  </div>
</template>
